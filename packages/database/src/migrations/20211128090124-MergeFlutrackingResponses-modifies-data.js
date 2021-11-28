'use strict';

import assert from 'assert';
import groupBy from 'lodash.groupby';

import { arrayToDbString, insertObject } from '../utilities';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const RESPONSE_GROUP_BATCH_SIZE = 50;

const printProgress = (current, total) => {
  const percentage = Math.round((current / total) * 10000) / 100;
  // Return console cursor to the start of the current line
  process.stdout.write('\r\x1b[K');
  process.stdout.write(`${percentage}% done`);
};

const processInBatches = async (array, batchSize, processBatch) => {
  let i = 0;
  while (i < array.length) {
    const batch = array.slice(i, i + batchSize);
    await processBatch(batch, i);
    i += batchSize;
  }
};

const createAnswers = async (db, answers) => {
  for (const answer of answers) {
    await insertObject(db, 'answer', answer);
  }
};

const deleteResponses = async (db, responseIds) => {
  assert.ok(responseIds.length, 'Response ids to delete is empty');
  await db.runSql(`delete from survey_response where id in (${arrayToDbString(responseIds)});`);
};

/**
 * Our eventually merging strategy is the following:
 * For each response group, use the most recent answer for each question and merge them in the
 * most recent response in the group
 *
 * This function returns the records that should be mutated to enable the above strategy
 */
const mergeAnswersInResponseGroup = (responses, answersByResponseId) => {
  assert.ok(responses.length > 1, 'Each response group should have at least 2 elements');

  const sortedResponses = [...responses].sort(
    (responseA, responseB) => responseB.endTime.getTime() - responseA.endTime.getTime(),
  );

  const mostRecentResponse = sortedResponses[0];
  const mostRecentAnswers = answersByResponseId[mostRecentResponse.id];
  const answeredQuestionIds = mostRecentAnswers.map(a => a.question_id);

  const responseIdsToDelete = [];
  const answersToCreate = [];
  for (let i = 1; i < sortedResponses.length; i++) {
    const response = sortedResponses[i];
    const answers = answersByResponseId[response.id];
    responseIdsToDelete.push(response.id);

    answers.forEach(answer => {
      const { question_id: questionId } = answer;
      if (!answeredQuestionIds.includes(questionId)) {
        answeredQuestionIds.push(questionId);
        // Merge the answer from a response other than the most recent in the most recent response
        // All other responses (and their answers) can be deleted since they are redundant
        answersToCreate.push({ ...answer, survey_response_id: mostRecentResponse.id });
      }
    });
  }

  return { responseIdsToDelete, answersToCreate };
};

const selectAnswersForResponseGroups = async (db, responseGroups) => {
  const responseIds = responseGroups.map(group => group.map(r => r.id)).flat();
  const { rows: answers } = await db.runSql(`
    select * from answer where survey_response_id IN (${arrayToDbString(responseIds)});
  `);
  return groupBy(answers, 'survey_response_id');
};

const processResponseGroups = async (db, responseGroupBatch) => {
  const a = Date.now();

  const answerByResponseId = await selectAnswersForResponseGroups(db, responseGroupBatch);
  const mergeData = responseGroupBatch.map(responseGroup =>
    mergeAnswersInResponseGroup(responseGroup, answerByResponseId),
  );

  const responseIdsToDelete = mergeData.map(r => r.responseIdsToDelete).flat();
  const answersToCreate = mergeData.map(d => d.answersToCreate).flat();
  await deleteResponses(db, responseIdsToDelete);
  await createAnswers(db, answersToCreate);
};

const groupResponsesByEntityAndWeek = duplicateResponses => {
  const groupedResponses = {};

  duplicateResponses.forEach(record => {
    const {
      id1,
      id2,
      end_time1: endTime1,
      end_time2: endTime2,
      entity_id: entityId,
      iso_week: isoWeek,
    } = record;
    const key = `${entityId}___${isoWeek}`;

    if (!(key in groupedResponses)) {
      groupedResponses[key] = {};
    }
    groupedResponses[key][id1] = { id: id1, endTime: endTime1 };
    groupedResponses[key][id2] = { id: id2, endTime: endTime2 };
  });

  return Object.values(groupedResponses).map(group => Object.values(group));
};

const selectDuplicateFlutrackingResponses = async (db, surveyCode) => {
  const { rows } = await db.runSql(`
    select
      sr.id as id1,
      sr2.id as id2,
      sr.end_time as end_time1,
      sr2.end_time as end_time2,
      sr.entity_id,
      concat(date_part('year', sr.data_time), 'W', date_part('week', sr.data_time)) as iso_week
    from survey_response sr
    join survey_response sr2 on sr2.id > sr.id and sr2.survey_id = sr.survey_id and sr2.entity_id = sr.entity_id
    join survey s on s.id = sr.survey_id
    where
      s.code = '${surveyCode}' and
      -- Join on same ISO week
      date_part('year', sr.data_time) = date_part('year', sr2.data_time) and
      date_part('week', sr.data_time) = date_part('week', sr2.data_time);
  `);

  return rows;
};

const mergeFlutrackingResponses = async (db, surveyCode) => {
  console.log(`Merging duplicate responses for ${surveyCode}`);

  const duplicateResponses = await selectDuplicateFlutrackingResponses(db, surveyCode);
  const responseGroups = groupResponsesByEntityAndWeek(duplicateResponses);

  console.log(
    'Processing response groups in batches. Each batch will be processed as a transaction',
  );
  console.log(`Batches found: ${responseGroups.length}`);
  await processInBatches(responseGroups, RESPONSE_GROUP_BATCH_SIZE, async (responseGroup, i) => {
    await db.runSql('START TRANSACTION');
    printProgress(i, responseGroups.length);
    await processResponseGroups(db, responseGroup);
    await db.runSql('COMMIT');
  });

  console.log('\nResponse merge was successful!');
};

exports.up = async function (db) {
  await mergeFlutrackingResponses(db, 'FLWV'); // Flutracking LGA Weekly Values
  await mergeFlutrackingResponses(db, 'FPWV'); // Flutracking - Postcode
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

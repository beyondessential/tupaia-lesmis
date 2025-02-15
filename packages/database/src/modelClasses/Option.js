/**
 * Tupaia MediTrak
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */

import { hasContent } from '@tupaia/utils';
import { DatabaseModel } from '../DatabaseModel';
import { DatabaseType } from '../DatabaseType';
import { TYPES } from '../types';

class OptionType extends DatabaseType {
  static databaseType = TYPES.OPTION;

  static fieldValidators = new Map()
    .set('value', [
      value => {
        try {
          return hasContent(value) && null;
        } catch (error) {
          return error.message;
        }
      },
      async (value, model) => {
        const foundConflict = await findFieldConflict('value', value, model);
        if (foundConflict) return 'Found duplicate values in option set';
        return null;
      },
      async (value, model) => {
        if (!model.label) {
          const foundConflict = await findFieldConflict('label', value, model);
          if (foundConflict)
            return 'Label is not provided; value cannot conflict with another label in option set';
          return null;
        }
        return null;
      },
    ])
    .set('label', [
      async (label, model) => {
        if (label) {
          const foundConflict = await findFieldConflict('label', label, model);
          if (foundConflict) return 'Found duplicate label in option set';
        }
        return null;
      },
    ]);

  async getSurveyIds() {
    const surveyScreens = await this.database.executeSql(
      `
       SELECT survey_screen.survey_id
       FROM survey_screen
       INNER JOIN survey_screen_component
         ON survey_screen_component.screen_id = survey_screen.id
       INNER JOIN question
         ON question.id = survey_screen_component.question_id
       INNER JOIN option_set
         ON option_set.id = question.option_set_id
       INNER JOIN option
         ON option.option_set_id = option_set.id
       WHERE option.id = ?
     `,
      this.id,
    );
    return surveyScreens.map(s => s.survey_id);
  }
}

export class OptionModel extends DatabaseModel {
  get DatabaseTypeClass() {
    return OptionType;
  }

  async getLargestSortOrder(optionSetId) {
    const options = await this.find({ option_set_id: optionSetId });
    const sorOrders = options.map(option => option.sort_order); // sort_order should not be null;
    return Math.max(...sorOrders);
  }
}

const findFieldConflict = async (field, valueToCompare, model) => {
  const conflictingOption = await model.otherModels.option.findOne({
    [field]: valueToCompare || null,
    option_set_id: model.option_set_id,
    id: {
      comparator: '!=',
      comparisonValue: model.id || null,
    },
  });
  return !!conflictingOption;
};

/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */
import { getTestDatabase } from '@tupaia/database';

const TONGA_REGIONAL_DE_CODES = ["CH2bSurveyDate","CH283","CH284","CH276","CH274","CH275","CH267","CH268","CH269","CH272","CH270","CH273","CH271","CH277","CH278","CH279","CH280","CH281","CH282","CH3SurveyDate","CH288","CH290","CH291","CH292","CH297","CH293","CH295","CH296","CH294","CH289","CH287","CH4SurveyDate","CH251","CH252","CH250","CH249","CH264","CH265","CH261","CH262","CH263","CH256","CH255","CH253","CH254","CH257","CH259","CH258","CH244","CH245","CH246","CH247","CH248","CH243","CH241","CH3","CH2","CH7","CH6","CH5","CH4","CH9","CH8","CH240","CH239","CH12","CH13","CH14","CH11","CH10","CH1SurveyDate","CH328","CH327","CH326","CH325","CH324","CH329","CH332","CH333","CH334","CH330","CH331","CH6SurveyDate","CH350","CH8SurveyDate","CH349","CH433","CH435","CH449","CH448","CH446","CH447","CH445","CH406","CH405","CH413","CH432","CH411","CH427","CH409","CH410","CH437","CH436","CH434","CH420","CH419","CH438","CH439","CH441","CH443","CH440","CH442","CH444","CH428","CH429","CH431","CH407","CH430","CH416","CH415","CH417","CH423","CH414","CH421","CH412","CH424","CH422","CH418","CH10SurveyDate","CH425","CH426","CH408","CH5SurveyDate","CH301","CH300","CH299","CH304","CH303","CH302","CH307","CH306","CH305","CH310","CH309","CH308","CH319","CH318","CH317","CH322","CH321","CH320","CH313","CH312","CH311","CH316","CH315","CH314","CH2aSurveyDate","CH633","CH630","CH624","CH626","CH623","CH622","CH629","CH628","CH621","CH625","CH627","CH631","CH632","CH634","CH9SurveyDate","CH453","CH452","CH455","CH454","CH457","CH456","CH459","CH458","CH574","CH573","CH576","CH575","CH578","CH577","CH580","CH579","CH533","CH532","CH535","CH534","CH537","CH536","CH539","CH538","CH509","CH508","CH511","CH510","CH513","CH512","CH515","CH514","CH517","CH516","CH519","CH518","CH521","CH520","CH523","CH522","CH525","CH524","CH527","CH526","CH529","CH528","CH531","CH530","CH493","CH492","CH495","CH494","CH497","CH496","CH499","CH498","CH461","CH460","CH463","CH462","CH465","CH464","CH467","CH466","CH477","CH476","CH479","CH478","CH481","CH480","CH483","CH482","CH485","CH484","CH487","CH486","CH489","CH488","CH491","CH490","CH469","CH468","CH471","CH470","CH473","CH472","CH475","CH474","CH598","CH597","CH600","CH599","CH602","CH601","CH604","CH603","CH590","CH589","CH592","CH591","CH594","CH593","CH596","CH595","CH541","CH540","CH543","CH542","CH546","CH545","CH548","CH547","CH550","CH549","CH552","CH551","CH554","CH553","CH556","CH555","CH501","CH500","CH503","CH502","CH505","CH504","CH507","CH506","CH582","CH581","CH584","CH583","CH586","CH585","CH588","CH587","CH566","CH565","CH568","CH567","CH570","CH569","CH572","CH571","CH11SurveyDate","CH558","CH557","CH560","CH559","CH562","CH561","CH564","CH563","CH346","CH347","CH343","CH339","CH342","CH341","CH338","CH344","CH345","CH340","CH336","CH337","CH7SurveyDate","CH606","CH611","CH612","CH615","CH616","CH619","CH617","CH614","CH618","CH613","CH610","CH12SurveyDate","CH608","CH609","CH607","FP168","FP02SurveyDate","FP03SurveyDate","FP170","FP176","FP175","FP180","FP172","FP181","FP177","FP182","FP173","FP174","FP179","FP178","FP04SurveyDate","FP27","FP26","FP31","FP23","FP32","FP28","FP33","FP24","FP25","FP30","FP29","FP17","FP16","FP20","FP13","FP21","FP18","FP22","FP14","FP15","FP19","FP19_1","FP60","FP59","FP64","FP56","FP65","FP61","FP66","FP57","FP58","FP63","FP62","FP67","Family_Planning_Net_Change_Condom_Female","Family_Planning_Net_Change_Condom_Male","Family_Planning_Net_Change_Depo_Provera","Family_Planning_Net_Change_IUD","Family_Planning_Net_Change_Jadelle","Family_Planning_Net_Change_Natural_Method","Family_Planning_Net_Change_Other","Family_Planning_Net_Change_Pill_Combined","Family_Planning_Net_Change_Pill_Single","Family_Planning_Net_Change_Sterilization_Female","Family_Planning_Net_Change_Sterilization_Male","FP6","FP5","FP10","FP2","FP11","FP7","FP12","FP3","FP4","FP9","FP8","FP01SurveyDate","Family_Planning_Acceptors_Condom_Female","Family_Planning_Acceptors_Condom_Male","Family_Planning_Acceptors_Depo_Provera","Family_Planning_Acceptors_IUD","Family_Planning_Acceptors_Jadelle","Family_Planning_Acceptors_Natural_Method","Family_Planning_Acceptors_Other","Family_Planning_Acceptors_Pill_Combined","Family_Planning_Acceptors_Pill_Single","Family_Planning_Acceptors_Sterilization_Female","Family_Planning_Acceptors_Sterilization_Male","FP38","FP37","FP42","FP34","FP43","FP39","FP44","FP35","FP36","FP41","FP40","FP49","FP48","FP53","FP45","FP54","FP50","FP55","FP46","FP47","FP52","FP51","HP09SurveyDate","HP216","HP04SurveyDate","HP08SurveyDate","HP323a","HP299a","HP5","HP21","HP20","HP19","HP18","HP23","HP22","HP25","HP24","HP27","HP26","HP3","HP6","HP4","HP11","HP10","HP9","HP8","HP13","HP12","HP15","HP14","HP17","HP16","HP01SurveyDate","HP7","HP275","HP274","HP270","HP271","HP272","HP269","HP268","HP256","HP257","HP261","HP262","HP260","HP255","HP258","HP254","HP259","HP273","HP253","HP277","HP276","HP06SurveyDate","HP265","HP266","HP267","HP264","HP263","IMMS9","IMMS7","IMMS02SurveyDate","IMMS8","IMMS6","IMMS41","IMMS40","IMMS59","IMMS58","IMMS45","IMMS44","IMMS47","IMMS46","IMMS49","IMMS48","IMMS43","IMMS42","IMMS51","IMMS50","IMMS61","IMMS60","IMMS63","IMMS62","IMMS53","IMMS52","IMMS55","IMMS54","IMMS57","IMMS56","IMMS06SurveyDate","IMMS07SurveyDate","IMMS66","IMMS65","IMMS68","IMMS67","IMMS70","IMMS69","IMMS72","IMMS71","IMMS74","IMMS73","IMMS76","IMMS75","IMMS79","IMMS78","IMMS79_1","IMMS79_2","IMMS80","IMMS81","IMMS08SurveyDate","IMMS11","IMMS20","IMMS13","IMMS14","IMMS15","IMMS12","IMMS16","IMMS21","IMMS22","IMMS17","IMMS18","IMMS19","IMMS03SurveyDate","IMMS04SurveyDate","IMMS24","IMMS25","IMMS26","IMMS27","IMMS28","IMMS29","IMMS31","IMMS36","IMMS33","IMMS32","IMMS34","IMMS38","IMMS35","IMMS05SurveyDate","IMMS37","IMMS2","IMMS01SurveyDate","IMMS3","IMMS4","MCH08SurveyDate","MCH02SurveyDate","MCH48","MCH49","MCH46","MCH47","MCH52","MCH42","MCH42_1","MCH54","MCH53","MCH44","MCH45","MCH55","MCH56","MCH43","MCH43_1","MCH50","MCH51","MCH04SurveyDate","MCH75","MCH104","MCH106","MCH84","MCH90","MCH96","MCH102","MCH107","MCH78","MCH79","MCH105","MCH76","MCH77","MCH108","MCH81","MCH87","MCH88","MCH93","MCH94","MCH99","MCH82","MCH100","MCH83","MCH89","MCH95","MCH101","MCH85","MCH91","MCH97","MCH103","MCH06SurveyDate","MCH80","MCH05SurveyDate","MCH113","MCH114","MCH112","MCH119","MCH116","MCH111","MCH117","MCH120","MCH115","MCH110","MCH118","MCH07SurveyDate","MCH109_1","MCH10","MCH12","MCH13","MCH3","MCH11","MCH8","MCH14","MCH14_5","MCH7","MCH5","MCH6","MCH01SurveyDate","MCH9","MCH2","MCH31","MCH32","MCH29","MCH30","MCH25","MCH25_1","MCH35","MCH38","MCH37","MCH36","MCH27","MCH28","MCH39","MCH40","MCH26","MCH26_1","MCH33","MCH34","MCH03SurveyDate","POP03SurveyDate","POP048","POP051","POP047","POP050","POP049","POP02SurveyDate","POP04SurveyDate","POP41","POP40","POP39","POP38","POP01SurveyDate","POP42"];

describe('multiDhis', () => {
  const db = getTestDatabase();

  it('dashboard_items', async () => {
    console.log('hi');

    let i = 0;

    for (const code of TONGA_REGIONAL_DE_CODES) {
      const sql = `
        select distinct project_codes
        from (
                 select di.code as dashboard_item_code, dr.project_codes
                 from dashboard_item di
                          left join dashboard_relation dr on di.id = dr.child_id
                 where di.report_code in
                       ((
                            select code
                            from report
                            where config::text like '%"${code}"%'
                        )
                        union
                        (
                            select code
                            from legacy_report
                            where data_builder_config::text like '%"${code}"%'
                        ))
             ) x
      `;
      const projectCodes = await db.connection.raw(sql);
      // console.log('code', `${i} / ${TONGA_REGIONAL_DE_CODES.length}`, code);
      if (projectCodes.rowCount > 1 || (projectCodes.rowCount === 1 && projectCodes.rows[0].project_codes.length > 1)) {
        console.log('projectCodes', code, projectCodes.rows);
      }
      i++;
      // if (i > 5) break;
    }
  })

  it.only('map_overlays', async () => {
    console.log('hi');

    let i = 0;

    for (const code of TONGA_REGIONAL_DE_CODES) {
      const sql = `
        select distinct project_codes
        from (
                 select mo.code as map_overlay_code, mo.project_codes
                 from map_overlay mo
                          left join map_overlay_group_relation mogr on mo.id = mogr.child_id
                 where mo.report_code in
                       ((
                            select code
                            from report
                            where config::text like '%"${code}"%'
                        )
                        union
                        (
                            select code
                            from legacy_report
                            where data_builder_config::text like '%"${code}"%'
                        ))
             ) x;
      `;
      const projectCodes = await db.connection.raw(sql);
      // console.log('code', `${i} / ${TONGA_REGIONAL_DE_CODES.length}`, code);
      if (projectCodes.rowCount > 1 || (projectCodes.rowCount === 1 && projectCodes.rows[0].project_codes.length > 1)) {
        console.log('projectCodes', code, projectCodes.rows);
      }
      i++;
      // if (i > 5) break;
    }
  })

});

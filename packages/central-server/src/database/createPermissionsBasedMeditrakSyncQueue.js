const query = `
drop materialized view if exists permissions_based_meditrak_sync_queue;
create materialized view permissions_based_meditrak_sync_queue as 
select msq.*, 
	e.country_code as entity_country, 
	e."type" as entity_type, 
	c_e.country_code as clinic_country, 
	ga_e.country_code as geographical_area_country, 
	s_pg."name" as survey_permission, 
	s.country_ids  as survey_countries, 
	sg_s_pg."name" as survey_group_permission, 
	sg_s.country_ids as survey_group_countries,
	ss_s_pg."name" as survey_screen_permission, 
	ss_s.country_ids as survey_screen_countries, 
	ssc_ss_s_pg."name" as survey_screen_component_permission, 
	ssc_ss_s.country_ids as survey_screen_component_countries, 
	q_ssc_ss_s_pg."name" as question_permission, 
	q_ssc_ss_s.country_ids  as question_countries, 
	os_q_ssc_ss_s_pg."name" as option_set_permission, 
	os_q_ssc_ss_s.country_ids as option_set_countries, 
	o_os_q_ssc_ss_s_pg."name" as option_permission, 
	o_os_q_ssc_ss_s.country_ids as option_countries
from meditrak_sync_queue msq 
left join entity e on msq.record_id = e.id
left join clinic c on msq.record_id = c.id
left join entity c_e on c.country_id = c_e.id 
left join geographical_area ga on msq.record_id = ga.id 
left join entity ga_e on ga.country_id = ga_e.id 
left join survey s on msq.record_id = s.id 
left join permission_group s_pg on s.permission_group_id = s_pg.id 
left join survey_group sg on msq.record_id = sg.id
left join survey sg_s on sg_s.survey_group_id = sg.id 
left join permission_group sg_s_pg on sg_s.permission_group_id = sg_s_pg.id  
left join survey_screen ss on msq.record_id = ss.id
left join survey ss_s on ss.survey_id  = ss_s.id 
left join permission_group ss_s_pg on ss_s.permission_group_id = ss_s_pg.id 
left join survey_screen_component ssc on msq.record_id = ssc.id
left join survey_screen ssc_ss on ssc.screen_id = ssc_ss.id
left join survey ssc_ss_s on ssc_ss.survey_id  = ssc_ss_s.id 
left join permission_group ssc_ss_s_pg on ssc_ss_s.permission_group_id = ssc_ss_s_pg.id 
left join question q on msq.record_id = q.id
left join survey_screen_component q_ssc on q_ssc.question_id = q.id
left join survey_screen q_ssc_ss on q_ssc.screen_id = q_ssc_ss.id
left join survey q_ssc_ss_s on q_ssc_ss.survey_id  = q_ssc_ss_s.id 
left join permission_group q_ssc_ss_s_pg on q_ssc_ss_s.permission_group_id = q_ssc_ss_s_pg.id 
left join option_set os on msq.record_id = os.id 
left join question os_q on os_q.option_set_id = os.id
left join survey_screen_component os_q_ssc on os_q_ssc.question_id = os_q.id
left join survey_screen os_q_ssc_ss on os_q_ssc.screen_id = os_q_ssc_ss.id
left join survey os_q_ssc_ss_s on os_q_ssc_ss.survey_id  = os_q_ssc_ss_s.id 
left join permission_group os_q_ssc_ss_s_pg on os_q_ssc_ss_s.permission_group_id = os_q_ssc_ss_s_pg.id 
left join "option" o on msq.record_id = o.id
left join option_set o_os on o.option_set_id = o_os.id 
left join question o_os_q on o_os_q.option_set_id = o_os.id
left join survey_screen_component o_os_q_ssc on o_os_q_ssc.question_id = o_os_q.id
left join survey_screen o_os_q_ssc_ss on o_os_q_ssc.screen_id = o_os_q_ssc_ss.id
left join survey o_os_q_ssc_ss_s on o_os_q_ssc_ss.survey_id  = o_os_q_ssc_ss_s.id 
left join permission_group o_os_q_ssc_ss_s_pg on o_os_q_ssc_ss_s.permission_group_id = o_os_q_ssc_ss_s_pg.id;
`;

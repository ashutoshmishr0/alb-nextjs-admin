// export let base_url: string, img_url: string, api_url: string;
export const base_url = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/')
    ? process.env.NEXT_PUBLIC_API_URL
    : `${process.env.NEXT_PUBLIC_API_URL}/`)
  : "http://localhost:3003/";

export const img_url = process.env.NEXT_PUBLIC_IMAGE_URL
  ? (process.env.NEXT_PUBLIC_IMAGE_URL.endsWith('/')
    ? process.env.NEXT_PUBLIC_IMAGE_URL
    : `${process.env.NEXT_PUBLIC_IMAGE_URL}/`)
  : "https://api.acharyalavbhushan.com/";

export const api_url = ""


//! Dashboard
export const get_dashboard = 'api/admin/get_dashboard'
export const get_recharge_report = (month: any, year: any) => `api/admin/recharge-per-day-history?month=${month}&year=${year}`;
export const get_service_used_report = 'api/admin/get_count_service_used';
export const get_earning_report = (month: any, year: any) => `api/admin/get_admin_earning?month=${month}&year=${year}`;
// export const get_earning_graph = 'admin/get_admin_earning_graph';

//! Astrologer
export const get_astrologer = 'api/admin/get-all-astrologers';
export const get_enquiry_astrologer = 'api/astrologer/get-astrologer-inquiry';
export const get_astrologer_by_id = 'api/admin/astrologer_details_by_id';
export const get_astrologer_duration_by_id = (id: any) => `api/astrologer/get_duration/${id}`;
export const create_astrologer = 'api/admin/add-astrologer';
export const update_astrologer_by_id = 'api/admin/update-astrologer';
export const delete_astrologer_by_id = "api/admin/delete-astrologer-account";
export const get_chat_history_by_astrologer_id = 'api/admin/astrologer_chat_history'; //* type - chat
export const get_call_history_by_astrologer_id = 'api/admin/astrologer_chat_history'; //* type - call
export const get_video_call_history_by_astrologer_id = 'api/admin/astrologer_chat_history'; //* type - VideoCall
export const get_live_history_by_astrologer_id = 'api/admin/astrologer_chat_history'; //* type - live_video_call
export const get_gift_history_by_astrologer_id = 'api/admin/get_astrologer_gift_history';
export const get_review_by_astrologer_id = 'api/admin/get-astrologer-review';
export const get_transaction_history_by_astrologer_id = 'api/admin/astrologer_transaction_histroy';
export const get_puja_history_by_astrologer_id = 'api/admin/';
export const update_wallet_by_astrologer_id = 'api/admin/add_deduct_astrologer_wallet';
export const verify_astrologer_profile = "api/astrologer/verify-astrologer-profile";
export const change_astrologer_chat_status = 'api/astrologer/change-chat-status';
export const change_astrologer_call_status = 'api/astrologer/change-call-status';
export const change_astrologer_video_call_status = 'api/admin/change_videocall_status';
export const get_astrologer_withdrawal_request = 'api/admin/get_withdraw_request';
export const approve_astrologer_withdrawal_request_amount = 'api/admin/approve_withdraw_request';
export const get_astrologer_issues = 'api/admin/get_all_astrologers_issue';
export const get_astrologer_leave_request = 'api/admin/get_all_leave_requests';
export const approve_reject_astrologer_leave_request = 'api/admin/update_leave_status';

//! Customer
export const get_customer = 'api/customers/get-all-customers';
export const get_customer_by_id = 'api/admin/customer_details_by_id';
export const create_customer = "api/customers/customer-signup";
export const update_customer_by_id = 'api/admin/update-customer-data';
export const delete_customer_by_id = "api/admin/delete-customer";
export const change_customer_banned_unbanned_status = "api/admin/change-banned-status";
export const update_wallet_by_customer_id = 'api/admin/add_deduct_customer_wallet';
export const get_chat_history_by_customer_id = 'api/admin/customer_chat_history'; //* type - chat
export const get_call_history_by_customer_id = 'api/admin/customer_chat_history'; //* type - call
export const get_video_call_history_by_customer_id = 'api/admin/customer_chat_history'; //* type - VideoCall
export const get_live_history_by_customer_id = 'api/admin/customer_chat_history'; //* type - live_video_call
export const get_puja_history_by_customer_id = 'api/admin/';
export const get_order_history_by_customer_id = 'api/customers/getCustomerOrder';
export const get_following_history_by_customer_id = 'api/admin/customer_followed_list';
export const get_review_history_by_customer_id = 'api/admin/get-customer-review';

//! Astro-Puja
export const get_puja_category = 'api/puja/get_puja_category';
export const create_puja_category = 'api/puja/create_puja_category';
export const update_puja_category = 'api/puja/update_puja_category';
export const delete_puja_category = 'api/puja/delete_puja_category';
export const get_puja = 'api/puja/get_puja';
export const create_puja = 'api/puja/create_puja';
export const update_puja = 'api/puja/update_puja';
export const delete_puja = 'api/puja/delete_puja';
export const get_puja_register = 'api/puja/all_astrologer_register_puja';
export const approve_puja_register = 'api/puja/approve_astrologer_register_puja';
export const get_puja_booked = 'api/puja/get_all_booked_pujas';
export const get_puja_booked_by_id = 'api/puja/get_puja_detail_by_id';
export const complete_request_puja = 'api/puja/approve_puja_completed_request';
export const get_puja_order_by_id = 'api/puja/get_puja_order_id'
export const get_astrologer_register_on_puja = 'api/puja/get_astrologer_register_on_puja'
export const update_assign_astro_status = 'api/puja/update_assign_astro_status'
export const assign_astro = 'api/puja/assign_astro'

// Todo : To be removed
export const get_puja_request = 'api/ecommerce/all_requested_puja';
export const assign_puja = 'api/ecommerce/puja_assign_to_astrologer';
export const change_puja_status = 'api/ecommerce/change_puja_status';
export const get_puja_history = 'api/ecommerce/get_puja_history';

//! Live Session
//? Category
export const get_live_session_category = 'api/admin/get_live_session_category';
export const create_live_session_category = 'api/admin/create_live_session_category';
export const update_live_session_category = 'api/admin/update_live_session_category';
export const delete_live_session_category = 'api/admin/delete_live_session_category';

//? Topic
export const get_live_session_topic = 'api/admin/get_live_session_topic';
export const create_live_session_topic = 'api/admin/create_live_session_topic';
export const update_live_session_topic = 'api/admin/update_live_session_topic';
export const delete_live_session_topic = 'api/admin/delete_live_session_topic';

//! History
export const get_chat_history = 'api/admin/get_chat_history';
export const get_call_history = 'api/admin/get_call_history';
export const get_video_call_history = 'api/admin/all_videocall_history';
export const get_live_history = 'api/admin/all_live_videocall_history';
export const get_gift_history = 'api/admin/get_all_gift_history';

//! Skill
export const get_skill = 'api/admin/get-skill';
export const create_skill = 'api/admin/skill';
export const update_skill = 'api/admin/update-skill';
export const delete_skill = 'api/admin/delete-skill';

//! Remedies
export const get_remedies = 'api/admin/view-remedy';
export const create_remedies = 'api/admin/add-remedy';
export const update_remedies = 'api/admin/update-remedy';
export const delete_remedies = 'api/admin/delete-remedy';

//! Expertise 
export const get_expertise = 'api/admin/get-all-expertise';
export const create_expertise = 'api/admin/add-expertise';
export const update_expertise = 'api/admin/update-expertise';
export const delete_expertise = 'api/admin/delete-expertise';
export const get_main_expertise = 'api/admin/get-all-main-expertise';
export const create_main_expertise = 'api/admin/add-main-expertise';
export const update_main_expertise = 'api/admin/update-main-expertise';
export const delete_main_expertise = 'api/admin/delete-main-expertise';

//! Static Page
export const get_terms_and_conditions = 'api/admin/get-terms-condition';
export const create_terms_and_conditions = 'api/admin/add-terms-condition';
export const get_privacy_policy = 'api/admin/get-privacy-policy';
export const create_privacy_policy = 'api/admin/add-privacy-policy';
export const get_about_us = 'api/admin/get-about-us';
export const create_about_us = 'api/admin/add-about-us';

//! Master 
//? Free Minutes
export const get_free_minutes = 'api/admin/get-free-minutes';
export const create_free_minutes = 'api/admin/free-minutes';

//? Platform Charges
export const get_platform_charges = 'api/admin/platform-charges';
export const create_platform_charges = 'api/admin/create-platform-charges';
export const delete_platform_charges = (id: any) => `api/admin/del-platform-charges/${id}`;

//? Slot Management
export const get_slot_duration = 'api/admin/get_slots_duration';
export const create_slot_duration = 'api/admin/create_slots_duration';
export const update_slot_duration = ({ id }: { id: string | number }) => `api/admin/update_slots_duration/${id}`;
export const delete_slot_duration = ({ id }: { id: string | number }) => `api/admin/delete_slots_duration/${id}`;

//? Predefined Message
export const get_predefined_message = 'api/admin/get_predefined_message';
export const create_predefined_message = 'api/admin/create_predefined_message';
export const update_predefined_message = 'api/admin/update_predefined_message';
export const delete_predefined_message = 'api/admin/delete_predefined_message';

//! Astro-Blog
//? Category
export const get_astro_blog_category = 'api/admin/blog-category-list';
export const create_astro_blog_category = 'api/admin/add-blog-category';
export const update_astro_blog_category = 'api/admin/update_blog_category';
export const delete_astro_blog_category = 'api/admin/delete_blog_category';

//? Blog
export const get_astro_blog = 'api/admin/get_astro_blogs';
export const create_astro_blog = 'api/admin/add-astro-blog';
export const update_astro_blog = 'api/admin/update_astro_blog';
export const delete_astro_blog = 'api/admin/delete_astro_blogs';

//TODO---------------------Working-----------------------TODO// 

//! Banner 
export const get_app_banners = 'admin/get-app-banners'
export const add_banner = "admin/add-banners"
export const update_banner = "admin/update-banners"
export const delete_banner = "admin/delete-banners"
export const get_banners = 'admin/get-banners'
export const change_banner_status = 'api/admin/update_banner_status';

//! Astro-Mall
export const get_astro_mall_category = 'ecommerce/get_product_category';
export const create_astro_mall_category = 'ecommerce/create_product_category';
export const update_astro_mall_category = 'ecommerce/update_product_category';
export const delete_astro_mall_category = 'ecommerce/delete_product_category';

export const get_astro_mall_product = 'ecommerce/get_products';
export const create_astro_mall_product = 'ecommerce/create_products';
export const update_astro_mall_product = 'ecommerce/update_products';
export const delete_astro_mall_product = 'ecommerce/delete_product';

//! All-Products
export const get_all_products = 'ecommerce/get_all_products';

//! order History
export const get_order_history = 'ecommerce/order_history';
export const change_order_status = 'ecommerce/change_order_status';

//! Gift
export const add_gift = "admin/add-gift";
export const get_all_gift = "admin/get-all-gift";
export const update_gift = "admin/update-gift";
export const delete_gift = "admin/delete-gift";

//! Rewiews
export const add_review = "admin/add-review";
export const get_review = "api/admin/get-all-review";
export const update_review = "admin/update-review";
export const delete_review = "admin/delete-review";
export const verify_review = 'admin/verify-review'

export const add_astrologer = "admin/add-astrologer";
export const update_astrologer = "admin/update-astrologer";

export const create_recharge_plan = "admin/create_recharge_plan";
export const get_recharge_plans = "admin/get-all-recharge-plans";
export const update_recharge_plans = "admin/update-recharge-plan"
export const delete_recharge_plans = "admin/delete-recharge-plan"
export const update_recharge_plan_status = "admin/update-recharge-plan-status"

export const add_first_recharge_offer = "admin/add-first-recharge";
export const get_first_recharge_offer = "admin/get-first-recharge"
export const update_first_recharge_offer = "admin/update-first-recharge-offer"
export const delete_first_recharge_offer = "admin/delete-first-recharge-offer"

export const get_all_astrologers = "admin/get-all-astrologers";
export const verify_astrologer = "astrologer/verify-astrologer-profile";
export const delete_astrologer = "admin/delete-astrologer-account"
export const change_call_status = 'astrologer/change-call-status'
export const change_chat_status = 'astrologer/change-chat-status'
export const get_enquired_astrologer = 'astrologer/get-enquired-astrologer'
export const change_enquiry_status = 'astrologer/change_enquiry_status'
export const get_recent_live_streaming = 'customers/get_recent_live_streaming'

//! inquiry 
export const get_astrologer_inquiry = 'astrologer/get-astrologer-inquiry'

export const create_qualifications = "admin/create_qualifications";
export const get_qualifications = "admin/get_qualifications";
export const update_qualifications = "admin/update_qualifications";

export const get_request_astrologer = "admin/get_astrologer_requests";
export const update_request_astrologer = "admin/update_service_charges";

export const get_all_users = "admin/get-all-user"
export const add_notifications = "admin/add-notifications"
export const get_all_notifications = "admin/get-all-notifications"

export const get_all_customers = "customers/get-all-customers"
export const ban_customer = "admin/change-banned-status"
export const online_offline_customer = "admin/set-customer-online"
// export const create_customer = "customers/customer-signup"
export const update_customer = "admin/update-customer-data"
export const delete_customer = "admin/delete-customer"
export const customer_chat_history = "customers/customers-chat-history"
export const customer_call_history = "customers/customers-call-history"
export const customer_payment_history = "admin/customers-payment-list"

export const add_customer_recharge = 'admin/recharge-customer-wallet'

export const send_customer_notification = 'admin/send_customer_notification'
export const get_customer_notification = 'admin/get-customer-notification'
export const send_astrologer_notification = 'admin/send_astrologer_notification'
export const get_astrologer_notification = 'admin/get-astrologer-notification'

export const get_admin_earnig_history = 'admin/get_admin_earnig_history'
export const get_wallet_payments = 'admin/get_wallet_payments'

export const create_language = 'admin/create_language'
export const get_language = 'api/admin/get_language'
export const update_language = 'admin/update_language'
export const delete_language = 'admin/delete_language'

export const add_ask_question = 'admin/add-ask-question'
export const get_all_ask_question = 'admin/get-all-ask-question'
export const delete_ask_question = 'admin/delete-ask-question'
export const update_ask_question = 'admin/update-ask-question'

export const add_religion_spirituality = 'admin/add-religion-spirituality'
export const get_all_religion_spirituality = 'admin/get-all-religion-spirituality'
export const delete_religion_spirituality = 'admin/delete-religion-spirituality'
export const update_religion_spirituality = 'admin/update-religion-spirituality'

export const add_astro_magazine = 'admin/add-astro-magazine'
export const get_all_astro_magazine = 'admin/get-all-astro-magazine'
export const delete_astro_magazine = 'admin/delete-astro-magazine'
export const update_astro_magazine = 'admin/update-astro-magazine'

export const add_announcement = 'admin/add-announcement'
export const get_all_anouncement = 'admin/get-all-anouncement'
export const delete_announcement = 'admin/delete-announcement'
export const update_announcement = 'admin/update-announcement'

export const add_birhat_horoscope = 'admin/add-birhat-horoscope'
export const get_all_birhat_horoscope = 'admin/get-all-birhat-horoscope'
export const delete_birhat_horoscope = 'admin/delete-birhat-horoscope'
export const update_birhat_horoscope = 'admin/update-birhat-horoscope'

export const add_auspicious_time = 'admin/add-auspicious-time'
export const get_all_auspicious_time = 'admin/get-all-auspicious-time'
export const delete_auspicious_time = 'admin/delete-auspicious-time'
export const update_auspicious_time = 'admin/update-auspicious-time'

export const add_daily_panchang = 'admin/add-daily-panchang'
export const get_all_daily_panchang = 'admin/get-all-daily-panchang'
export const delete_daily_panchang = 'admin/delete-daily-panchang'
export const update_daily_panchang = 'admin/update-daily-panchang'

export const add_yellow_book = 'admin/add-yellow-book'
export const get_all_yellow_book = 'admin/get-all-yellow-book'
export const delete_yellow_book = 'admin/delete-yellow-book'
export const update_yellow_book = 'admin/update-yellow-book'

export const add_numerology = 'admin/add-numerology'
export const get_all_numerology = 'admin/get-all-numerology'
export const delete_numerology = 'admin/delete-numerology'
export const update_numerology = 'admin/update-numerology'

export const add_vivahMuhurat = 'admin/add-vivahMuhurat'
export const get_all_vivahMuhurat = 'admin/get-all-vivahMuhurat'
export const delete_vivahMuhurat = 'admin/delete-vivahMuhurat'
export const update_vivahMuhurat = 'admin/update-vivahMuhurat'

export const add_mundanMuhurat = 'admin/add-mundanMuhurat'
export const get_all_mundanMuhurat = 'admin/get-all-mundanMuhurat'
export const delete_mundanMuhurat = 'admin/delete-mundanMuhurat'
export const update_mundanMuhurat = 'admin/update-mundanMuhurat'

export const add_annaprashan = 'admin/add-annaprashan'
export const get_all_annaprashan = 'admin/get-all-annaprashan'
export const delete_annaprashan = 'admin/delete-annaprashan'
export const update_annaprashan = 'admin/update-annaprashan'

export const create_app_tutorials = 'admin/create_app_tutorials'
export const get_app_tutorials = 'admin/get_app_tutorials'
export const delete_app_tutorials = 'admin/delete_app_tutorials'

export const get_all_country = 'https://api.countrystatecity.in/v1/countries'
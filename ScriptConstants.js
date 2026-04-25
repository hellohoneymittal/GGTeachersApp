//api constant

const APPLICATION_URL =
  "https://script.google.com/macros/s/AKfycbyRfb_4euEZT6bIfE7Ug-4nVa6-z4_oFRCZicujbBxR0haSRsJNeofyLv0Ezw2WPepNTA/exec";
const IMAGE_CONSTANT = {
  clickHere: "https://i.postimg.cc/g0LSdBpL/Click-Here.jpg",
  addUserIcon: "https://imghost.net/ib/E5PegaLvH4xfUED_1729512954.png",
  confirmationIcon: "https://i.ibb.co/BsvQsfb/Confirmation-icon.png",
  deleteIcon: "https://i.postimg.cc/cJZRzYzT/delete-Icon.png",
};
const API_TYPE_CONSTANT = {
  GET_TEACHER_CLASS_SUBJECTS_AND_STUDENTS_BY_NAME:
    "GET_TEACHER_CLASS_SUBJECTS_AND_STUDENTS_BY_NAME",
  SAVE_GG_STUDENT_JAPA_DATA: "SAVE_GG_STUDENT_JAPA_DATA",
  SAVE_ATTENDANCE: "SAVE_ATTENDANCE",
  GET_TEACHER_PENDING_EXAMS: "GET_TEACHER_PENDING_EXAMS",
  GET_TEACHER_ACCESS_BY_PASSWORD: "GET_TEACHER_ACCESS_BY_PASSWORD",
  SUBMIT_EXAM_MARKS: "SUBMIT_EXAM_MARKS",
  GET_CLASS_STUDENTS_MAP: "GET_CLASS_STUDENTS_MAP",
  GET_TEACHER_ELIGIBLE_SUBJECTS: "GET_TEACHER_ELIGIBLE_SUBJECTS",
  SUBMIT_TODAYS_WORK: "SUBMIT_TODAYS_WORK",
  GET_TEACHER_TIMETABLE: "GET_TEACHER_TIMETABLE",
  GET_TEACHER_PENDING_HOMEWORKS: "GET_TEACHER_PENDING_HOMEWORKS",
  SUBMIT_HOMEWORK_STATUS: "SUBMIT_HOMEWORK_STATUS",
  GET_TEACHER_CLASS_SUBJECTS_BY_NAME: "GET_TEACHER_CLASS_SUBJECTS_BY_NAME",
  SUBMIT_TEACHER_LEAVES: "SUBMIT_TEACHER_LEAVES",
  GET_PENDING_GATE_PASSES: "GET_PENDING_GATE_PASSES",
  GET_CLASS_EXAM_SCHEDULE: "GET_CLASS_EXAM_SCHEDULE",
  SUBMIT_QP_DISTRIBUTION_STATUS: "SUBMIT_QP_DISTRIBUTION_STATUS",
};
const DATE_FORMAT_CONSTANT = {
  grid: "DD MMM YYYY",
  database: "yyyy-MM-dd",
  gridWithDate: "DD MMM YYYY hh:mm A",
};

const PASSWORD_ERROR_STR = "Please enter a correct password";
const DATE_UTC = new Date().toISOString();

const CONTROL_TYPE_CONSTAINT = {
  input: "input",
  button: "button",
  checkbox: "checkbox",
};

// School start and end time
const school_end_time = "14:35";
const school_start_time = "06:50";

//page constant
const PASSWORD_CONTAINER = "passwordContainer";
const HM_CONTANER = "homeContainer";
const DM_CONTAINER = "donorMasterContainer";

const bheeshmUserNameLSKey = "bheeshmUserName";
const bheeshmUserFacilitatorLSKey = "bheeshmUserFacilitator";

const POPUP_CONSTANT = {
  error: "errorPopup",
  success: "successPopup",
};

const ICON_CONSTANT = {
  downloadIcon: "https://cdn-thumbs.imagevenue.com/85/09/8b/ME196HF8_t.png",
};

const ROLE_CONSTANT = {
  admin: "Admin",
  superAdmin: "Super Admin",
};

const ERROR_MESSAGE_CONSTANT = {
  general: "Something Went Wrong",
};

function getFormattedDateForDownload() {
  const today = new Date();
  const day = today.getDate();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[today.getMonth()];
  return `${day}${daySuffix(day)}${month}`;
}

function daySuffix(day) {
  if (day >= 11 && day <= 13) return "th"; // Special case for 11th, 12th, and 13th
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

const ExcelDate = getFormattedDateForDownload();

const VALIDATION_CONSTANT = {
  numberWithDecimal: "^d*.?d*$",
};

const INDEX_DB = {
  storeKey: "teacherLogin",
  dbName: "TeachersAppDB",
  storeName: "loginStore",
};

let CLASS_MAP = {
  "Sri Keshava Level 1": "Pre Nursery",
  "Sri Keshava Level 2": "Nursery",
  "Sri Keshava Level 3": "KG",
  "Sri Keshava Level 4": "UKG",
  "Sri Narayana": "I",
  "Sri Madhava": "II",
  "Sri Govinda": "III",
  "Sri Vishnu": "IV",
  "Sri Madhusudana": "V",
  "Sri Trivikrama": "VI",
  "Sri Vamana": "VII",
  "Sri Sridhara": "VIII",
  "Sri Hrishikesha": "IX",
  "Sri Padmanabha": "X",
  "Sri Damodara": "XI",
  "Sri Vasudeva": "XII",
};

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
};

export type AttendanceRecord = {
  __typename?: 'AttendanceRecord';
  enrollmentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  session: AttendanceSession;
  sessionId: Scalars['ID']['output'];
  status: AttendanceStatus;
};

export type AttendanceSession = {
  __typename?: 'AttendanceSession';
  classId: Scalars['ID']['output'];
  date: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
};

export enum AttendanceStatus {
  Absent = 'ABSENT',
  Late = 'LATE',
  Present = 'PRESENT'
}

export type Class = {
  __typename?: 'Class';
  createdAt: Scalars['DateTime']['output'];
  daysOfWeek: Array<Scalars['Int']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  invitedUserIds: Array<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  owner?: Maybe<User>;
  ownerId: Scalars['ID']['output'];
  startDate?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  year: Scalars['Int']['output'];
};

export type ClassGradeRow = {
  __typename?: 'ClassGradeRow';
  concept?: Maybe<Scalars['String']['output']>;
  enrollmentId: Scalars['ID']['output'];
  grades: Array<Grade>;
  student: Student;
};

export type ClassGrades = {
  __typename?: 'ClassGrades';
  evaluations: Array<Evaluation>;
  rows: Array<ClassGradeRow>;
};

export type ClassGroup = {
  __typename?: 'ClassGroup';
  grade: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  section: Scalars['String']['output'];
};

export type ClassInviteInfo = {
  __typename?: 'ClassInviteInfo';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  ownerName?: Maybe<Scalars['String']['output']>;
};

export type Enrollment = {
  __typename?: 'Enrollment';
  classId: Scalars['ID']['output'];
  concept?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  student: Student;
  studentId: Scalars['ID']['output'];
};

export type Evaluation = {
  __typename?: 'Evaluation';
  classId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  maxScore: Scalars['Float']['output'];
  title: Scalars['String']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export type Grade = {
  __typename?: 'Grade';
  enrollmentId: Scalars['ID']['output'];
  evaluationId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  score: Scalars['Float']['output'];
};

export type Lesson = {
  __typename?: 'Lesson';
  id: Scalars['ID']['output'];
  period: Scalars['Int']['output'];
  subject: Subject;
  teacher: Teacher;
  weekday: Weekday;
};

export type Location = {
  __typename?: 'Location';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: LocationKind;
  name: Scalars['String']['output'];
};

export enum LocationKind {
  Poi = 'POI',
  Room = 'ROOM'
}

export type MapData = {
  __typename?: 'MapData';
  locations: Array<Location>;
  roomShifts: Array<RoomShift>;
  subjects: Array<Subject>;
  teachers: Array<Teacher>;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptInvite: Class;
  assignClassGroup: RoomShift;
  clearLessonCell: Scalars['Boolean']['output'];
  createAndEnroll: Enrollment;
  createClass: Class;
  createEvaluation: Evaluation;
  createInviteLink: Scalars['String']['output'];
  createSubject: Subject;
  deleteClass: Scalars['Boolean']['output'];
  deleteEvaluation: Scalars['Boolean']['output'];
  excludeAttendanceDate: Scalars['Boolean']['output'];
  markAttendance: Scalars['Boolean']['output'];
  markPresent: Scalars['Boolean']['output'];
  renameClass: Class;
  renameEvaluation: Evaluation;
  renameStudent: Enrollment;
  saveLessonCell: Lesson;
  setEnrollmentConcept: Enrollment;
  unenrollStudent: Scalars['Boolean']['output'];
  updateClassSchedule: Class;
  upsertGrade: Grade;
};


export type MutationAcceptInviteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAssignClassGroupArgs = {
  grade: Scalars['String']['input'];
  locationCode?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  section: Scalars['String']['input'];
  shift: Shift;
};


export type MutationClearLessonCellArgs = {
  locationCode?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  period: Scalars['Int']['input'];
  shift: Shift;
  weekday: Weekday;
};


export type MutationCreateAndEnrollArgs = {
  classId: Scalars['ID']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationCreateClassArgs = {
  daysOfWeek?: InputMaybe<Array<Scalars['Int']['input']>>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  year: Scalars['Int']['input'];
};


export type MutationCreateEvaluationArgs = {
  classId: Scalars['ID']['input'];
  maxScore: Scalars['Float']['input'];
  title: Scalars['String']['input'];
  weight?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationCreateInviteLinkArgs = {
  classId: Scalars['ID']['input'];
};


export type MutationCreateSubjectArgs = {
  name: Scalars['String']['input'];
};


export type MutationDeleteClassArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEvaluationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExcludeAttendanceDateArgs = {
  classId: Scalars['ID']['input'];
  date: Scalars['DateTime']['input'];
};


export type MutationMarkAttendanceArgs = {
  classId: Scalars['ID']['input'];
  date: Scalars['DateTime']['input'];
  enrollmentId: Scalars['ID']['input'];
  status?: InputMaybe<AttendanceStatus>;
};


export type MutationMarkPresentArgs = {
  classId: Scalars['ID']['input'];
  dates: Array<Scalars['DateTime']['input']>;
  enrollmentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationRenameClassArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationRenameEvaluationArgs = {
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationRenameStudentArgs = {
  enrollmentId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationSaveLessonCellArgs = {
  locationCode?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  period: Scalars['Int']['input'];
  shift: Shift;
  subjectName: Scalars['String']['input'];
  teacherName: Scalars['String']['input'];
  weekday: Weekday;
};


export type MutationSetEnrollmentConceptArgs = {
  concept?: InputMaybe<Scalars['String']['input']>;
  enrollmentId: Scalars['ID']['input'];
};


export type MutationUnenrollStudentArgs = {
  enrollmentId: Scalars['ID']['input'];
};


export type MutationUpdateClassScheduleArgs = {
  daysOfWeek?: InputMaybe<Array<Scalars['Int']['input']>>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};


export type MutationUpsertGradeArgs = {
  enrollmentId: Scalars['ID']['input'];
  evaluationId: Scalars['ID']['input'];
  score: Scalars['Float']['input'];
};

export type Query = {
  __typename?: 'Query';
  attendanceDates: Array<Scalars['DateTime']['output']>;
  attendanceRecords: Array<AttendanceRecord>;
  class?: Maybe<Class>;
  classInviteInfo?: Maybe<ClassInviteInfo>;
  classes: Array<Class>;
  enrollments: Array<Enrollment>;
  evaluations: Array<Evaluation>;
  gradesByClass: ClassGrades;
  mapData: MapData;
};


export type QueryAttendanceDatesArgs = {
  classId: Scalars['ID']['input'];
  from?: InputMaybe<Scalars['DateTime']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryAttendanceRecordsArgs = {
  classId: Scalars['ID']['input'];
  from?: InputMaybe<Scalars['DateTime']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryClassArgs = {
  id: Scalars['ID']['input'];
};


export type QueryClassInviteInfoArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEnrollmentsArgs = {
  classId: Scalars['ID']['input'];
};


export type QueryEvaluationsArgs = {
  classId: Scalars['ID']['input'];
};


export type QueryGradesByClassArgs = {
  classId: Scalars['ID']['input'];
};

export type RoomShift = {
  __typename?: 'RoomShift';
  classGroup?: Maybe<ClassGroup>;
  id: Scalars['ID']['output'];
  lessons: Array<Lesson>;
  location: Location;
  shift: Shift;
};

export enum Shift {
  Matutino = 'MATUTINO',
  Noturno = 'NOTURNO',
  Vespertino = 'VESPERTINO'
}

export type Student = {
  __typename?: 'Student';
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Subject = {
  __typename?: 'Subject';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Teacher = {
  __typename?: 'Teacher';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export enum Weekday {
  Qua = 'QUA',
  Qui = 'QUI',
  Seg = 'SEG',
  Sex = 'SEX',
  Ter = 'TER'
}

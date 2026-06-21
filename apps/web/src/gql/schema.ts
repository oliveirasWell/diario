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
  name: Scalars['String']['output'];
  ownerId: Scalars['ID']['output'];
  startDate?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  year: Scalars['Int']['output'];
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

export type Mutation = {
  __typename?: 'Mutation';
  createAndEnroll: Enrollment;
  createClass: Class;
  createEvaluation: Evaluation;
  deleteClass: Scalars['Boolean']['output'];
  deleteEvaluation: Scalars['Boolean']['output'];
  excludeAttendanceDate: Scalars['Boolean']['output'];
  markAllPresent: Scalars['Boolean']['output'];
  markAttendance: Scalars['Boolean']['output'];
  setEnrollmentConcept: Enrollment;
  unenrollStudent: Scalars['Boolean']['output'];
  updateClassSchedule: Class;
  upsertGrade: Grade;
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


export type MutationMarkAllPresentArgs = {
  classId: Scalars['ID']['input'];
  date: Scalars['DateTime']['input'];
};


export type MutationMarkAttendanceArgs = {
  classId: Scalars['ID']['input'];
  date: Scalars['DateTime']['input'];
  enrollmentId: Scalars['ID']['input'];
  status?: InputMaybe<AttendanceStatus>;
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
  classes: Array<Class>;
  enrollments: Array<Enrollment>;
  evaluations: Array<Evaluation>;
  gradesByClass: Array<Grade>;
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


export type QueryEnrollmentsArgs = {
  classId: Scalars['ID']['input'];
};


export type QueryEvaluationsArgs = {
  classId: Scalars['ID']['input'];
};


export type QueryGradesByClassArgs = {
  classId: Scalars['ID']['input'];
};

export type Student = {
  __typename?: 'Student';
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

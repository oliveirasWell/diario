/** Codegen-only tag — runtime uses documents from `@/src/gql/graphql`. */
export function graphql(source: TemplateStringsArray): string {
  return source.join("");
}

export const ClassesDocument = graphql(`
  query Classes {
    classes {
      id
      name
      year
      ownerId
    }
  }
`);

export const ClassDocument = graphql(`
  query Class($id: ID!) {
    class(id: $id) {
      id
      name
      daysOfWeek
      startDate
      endDate
    }
  }
`);

export const HeaderClassDocument = graphql(`
  query HdrClass($id: ID!) {
    class(id: $id) {
      id
      name
    }
  }
`);

export const EnrollmentsDocument = graphql(`
  query Enrollments($classId: ID!) {
    enrollments(classId: $classId) {
      id
      concept
      student {
        id
        name
        email
      }
    }
  }
`);

export const AttendanceBoardDocument = graphql(`
  query AttendanceBoard($classId: ID!, $from: DateTime, $to: DateTime) {
    attendanceDates(classId: $classId, from: $from, to: $to)
    enrollments(classId: $classId) {
      id
      student {
        id
        name
      }
    }
    attendanceRecords(classId: $classId, from: $from, to: $to) {
      id
      enrollmentId
      status
      session {
        id
        date
      }
    }
  }
`);

export const EvaluationsDocument = graphql(`
  query Evaluations($classId: ID!) {
    evaluations(classId: $classId) {
      id
      classId
      title
      weight
      maxScore
      createdAt
    }
  }
`);

export const GradesByClassDocument = graphql(`
  query GradesByClass($classId: ID!) {
    gradesByClass(classId: $classId) {
      id
      enrollmentId
      evaluationId
      score
    }
  }
`);

export const CreateClassDocument = graphql(`
  mutation CreateClass($name: String!, $year: Int!) {
    createClass(name: $name, year: $year) {
      id
      name
      year
      ownerId
    }
  }
`);

export const DeleteClassDocument = graphql(`
  mutation DelClass($id: ID!) {
    deleteClass(id: $id)
  }
`);

export const RenameClassDocument = graphql(`
  mutation RenameClass($id: ID!, $name: String!) {
    renameClass(id: $id, name: $name) {
      id
      name
      year
    }
  }
`);

export const CreateAndEnrollDocument = graphql(`
  mutation CreateAndEnroll($classId: ID!, $name: String!, $email: String) {
    createAndEnroll(classId: $classId, name: $name, email: $email) {
      id
    }
  }
`);

export const UnenrollStudentDocument = graphql(`
  mutation Unenroll($enrollmentId: ID!) {
    unenrollStudent(enrollmentId: $enrollmentId)
  }
`);

export const RenameStudentDocument = graphql(`
  mutation RenameStudent($enrollmentId: ID!, $name: String!) {
    renameStudent(enrollmentId: $enrollmentId, name: $name) {
      id
      student {
        id
        name
        email
      }
    }
  }
`);

export const MarkAttendanceDocument = graphql(`
  mutation MarkAttendance(
    $classId: ID!
    $date: DateTime!
    $enrollmentId: ID!
    $status: AttendanceStatus
  ) {
    markAttendance(classId: $classId, date: $date, enrollmentId: $enrollmentId, status: $status)
  }
`);

export const MarkPresentDocument = graphql(`
  mutation MarkPresent($classId: ID!, $dates: [DateTime!]!, $enrollmentIds: [ID!]) {
    markPresent(classId: $classId, dates: $dates, enrollmentIds: $enrollmentIds)
  }
`);

export const ExcludeAttendanceDateDocument = graphql(`
  mutation Ex($classId: ID!, $date: DateTime!) {
    excludeAttendanceDate(classId: $classId, date: $date)
  }
`);

export const CreateEvaluationDocument = graphql(`
  mutation CreateEvaluation($classId: ID!, $title: String!) {
    createEvaluation(classId: $classId, title: $title, maxScore: 10) {
      id
      classId
      title
      weight
      maxScore
      createdAt
    }
  }
`);

export const RenameEvaluationDocument = graphql(`
  mutation RenameEvaluation($id: ID!, $title: String!) {
    renameEvaluation(id: $id, title: $title) {
      id
      title
    }
  }
`);

export const DeleteEvaluationDocument = graphql(`
  mutation DelEval($id: ID!) {
    deleteEvaluation(id: $id)
  }
`);

export const UpsertGradeDocument = graphql(`
  mutation UpsertGrade($enrollmentId: ID!, $evaluationId: ID!, $score: Float!) {
    upsertGrade(enrollmentId: $enrollmentId, evaluationId: $evaluationId, score: $score) {
      id
      enrollmentId
      evaluationId
      score
    }
  }
`);

export const SetConceptDocument = graphql(`
  mutation SetConcept($enrollmentId: ID!, $concept: String) {
    setEnrollmentConcept(enrollmentId: $enrollmentId, concept: $concept) {
      id
    }
  }
`);

export const ClassInviteInfoDocument = graphql(`
  query ClassInviteInfo($id: ID!) {
    classInviteInfo(id: $id) {
      id
      name
      ownerName
    }
  }
`);

export const AcceptInviteDocument = graphql(`
  mutation AcceptInvite($id: ID!) {
    acceptInvite(id: $id) {
      id
    }
  }
`);

export const CreateInviteLinkDocument = graphql(`
  mutation CreateInviteLink($classId: ID!) {
    createInviteLink(classId: $classId)
  }
`);

export const UpdateClassScheduleDocument = graphql(`
  mutation UpdateClassSchedule(
    $id: ID!
    $daysOfWeek: [Int!]
    $startDate: DateTime
    $endDate: DateTime
  ) {
    updateClassSchedule(
      id: $id
      daysOfWeek: $daysOfWeek
      startDate: $startDate
      endDate: $endDate
    ) {
      id
    }
  }
`);

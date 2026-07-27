Feature: Attendance board

  Scenario: Loading the board takes one request
    Given a class with session dates, students and records
    When the board is requested
    Then dates, students and records come back in a single GraphQL response

  Scenario: Resolving sessions takes one range query
    Given a class where only some of the requested days have a session
    When attendance is marked for those days
    Then the existing sessions are found with one range query
    And only the missing days are created

  Scenario: Mark one student present for the whole term
    Given a class with many session dates and an enrolled student
    When the teacher marks that student present on every date
    Then the existing records are updated in one call
    And the missing records are created in one call

  Scenario: Mark the whole class present on one date
    Given a class with several enrolled students
    When the teacher marks the class present without naming students
    Then every enrollment of the class gets a present record

  Scenario: Refuse a student from another class
    Given an enrollment id that does not belong to the class
    When the teacher marks it present
    Then the mutation fails with "Not found"

  Scenario: Bulk marking is all-or-nothing
    Given a class with dates and students
    When the teacher marks them present
    Then every write happens inside a single transaction

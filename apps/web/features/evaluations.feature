Feature: Evaluations

  Scenario: Rename an evaluation as class owner
    Given a teacher owns a class with an evaluation named "P1"
    When the teacher renames it to "Prova 1"
    Then the evaluation name becomes "Prova 1"

  Scenario: Rename an evaluation as invited teacher
    Given a teacher is invited to a class with an evaluation named "P1"
    When the teacher renames it to "Prova 1"
    Then the evaluation name becomes "Prova 1"

  Scenario: Refuse an empty evaluation name
    Given a teacher has an evaluation named "P1"
    When the teacher renames it to " "
    Then the mutation fails with "Título é obrigatório"
    And the evaluation keeps the name "P1"

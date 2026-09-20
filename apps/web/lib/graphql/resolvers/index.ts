import { classFieldResolvers, classMutationResolvers, classQueryResolvers } from "./class";
import { enrollmentMutationResolvers, enrollmentQueryResolvers } from "./enrollment";
import { evaluationMutationResolvers, evaluationQueryResolvers } from "./evaluation";
import { gradeMutationResolvers, gradeQueryResolvers } from "./grade";
import { attendanceMutationResolvers, attendanceQueryResolvers } from "./attendance";
import { mapMutationResolvers, mapQueryResolvers } from "./map";

export const resolvers = {
  ...classFieldResolvers,
  Query: {
    ...classQueryResolvers,
    ...enrollmentQueryResolvers,
    ...evaluationQueryResolvers,
    ...gradeQueryResolvers,
    ...attendanceQueryResolvers,
    ...mapQueryResolvers,
  },
  Mutation: {
    ...classMutationResolvers,
    ...enrollmentMutationResolvers,
    ...evaluationMutationResolvers,
    ...gradeMutationResolvers,
    ...attendanceMutationResolvers,
    ...mapMutationResolvers,
  },
};

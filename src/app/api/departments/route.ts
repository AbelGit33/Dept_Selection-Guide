import { NextResponse } from "next/server";
import { DEPARTMENT_INDEX } from "@/lib/data/departments";
import { CAREERS } from "@/lib/data/careers";
import { INTEREST_AXES, PHASES, SUBJECT_TAGS } from "@/lib/types";

export const revalidate = 86_400;

/** Read-only curriculum database: departments, prerequisites and role catalogue. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      counts: {
        departments: DEPARTMENT_INDEX.length,
        careers: CAREERS.length,
        requiredCourses: DEPARTMENT_INDEX.reduce((s, d) => s + d.curriculum.filter((c) => c.required).length, 0),
      },
      phases: PHASES,
      interestAxes: INTEREST_AXES,
      subjectTags: SUBJECT_TAGS,
      departments: DEPARTMENT_INDEX.map((d) => ({
        id: d.id,
        name: d.name,
        shortName: d.shortName,
        school: d.school,
        tagline: d.tagline,
        hue: d.hue,
        requirements: d.requirements,
        workload: d.workload,
        outcomes: d.outcomes,
        interestTags: d.interestTags,
        careerIds: d.careerIds,
        requiredCourses: d.curriculum.filter((c) => c.required).map((c) => ({
          code: c.code,
          title: c.title,
          credits: c.credits,
          category: c.category,
          hardGate: Boolean(c.hardGate),
          minGrade: c.minGrade,
        })),
      })),
      careers: CAREERS.map((c) => ({
        id: c.id,
        title: c.title,
        soc: c.soc,
        blurb: c.blurb,
        degreeLevel: c.degreeLevel,
        workStyles: c.workStyles,
        automationExposure: c.automationExposure,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
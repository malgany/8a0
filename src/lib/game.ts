import squadIndexRaw from "@/data/squad-index.json";
import squadsRaw from "@/data/squads.json";
import type {
  CampaignMatch,
  Draft,
  DraftOptions,
  Formation,
  PenaltyResult,
  Player,
  Position,
  SimResult,
  Slot,
  SquadFile,
  SquadMeta,
  Style,
  TeamStats,
  TournamentData,
  TournamentMatch,
  TournamentStage,
  TournamentStanding,
  TournamentTeam,
} from "./types";
import { nationName } from "./nations";

export const squadIndex = squadIndexRaw as SquadMeta[];
export const squadFiles = squadsRaw as SquadFile[];
const squadFilesByKey = new Map(squadFiles.map((squad) => [`${squad.sel}:${squad.copa}`, squad]));

export const defaultOptions: DraftOptions = {
  formation: "4-3-3",
  style: "equilibrado",
  mode: "classico",
};

export const modeConfig = {
  classico: { rerolls: 3, statsVisible: true },
  almanaque: { rerolls: 1, statsVisible: false },
} as const;

export const formations: Record<Formation, Record<Style, Slot[]>> = {
  "4-3-3": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 76 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 76 },
      { pos: "VOL", x: 38, y: 60 },
      { pos: "VOL", x: 62, y: 60 },
      { pos: "MC", x: 50, y: 50 },
      { pos: "PD", x: 80, y: 25 },
      { pos: "CA", x: 50, y: 18 },
      { pos: "PE", x: 20, y: 25 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 80, y: 74 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 20, y: 74 },
      { pos: "VOL", x: 50, y: 60 },
      { pos: "MC", x: 65, y: 50 },
      { pos: "MEI", x: 35, y: 50 },
      { pos: "PD", x: 82, y: 22 },
      { pos: "CA", x: 50, y: 17 },
      { pos: "PE", x: 18, y: 22 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 68 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 18, y: 68 },
      { pos: "MC", x: 50, y: 57 },
      { pos: "MC", x: 65, y: 45 },
      { pos: "MEI", x: 35, y: 45 },
      { pos: "PD", x: 82, y: 20 },
      { pos: "CA", x: 50, y: 15 },
      { pos: "PE", x: 18, y: 20 },
    ],
  },
  "4-4-2": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "MD", x: 80, y: 58 },
      { pos: "VOL", x: 60, y: 58 },
      { pos: "VOL", x: 40, y: 58 },
      { pos: "ME", x: 20, y: 58 },
      { pos: "CA", x: 40, y: 22 },
      { pos: "CA", x: 60, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "MD", x: 80, y: 57 },
      { pos: "VOL", x: 60, y: 53 },
      { pos: "MC", x: 40, y: 53 },
      { pos: "ME", x: 20, y: 57 },
      { pos: "CA", x: 40, y: 20 },
      { pos: "CA", x: 60, y: 20 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 74 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 18, y: 74 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 35, y: 52 },
      { pos: "MC", x: 65, y: 52 },
      { pos: "MEI", x: 50, y: 40 },
      { pos: "CA", x: 38, y: 20 },
      { pos: "CA", x: 62, y: 20 },
    ],
  },
  "4-2-3-1": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "VOL", x: 40, y: 65 },
      { pos: "VOL", x: 60, y: 65 },
      { pos: "PE", x: 20, y: 52 },
      { pos: "MEI", x: 50, y: 50 },
      { pos: "PD", x: 80, y: 52 },
      { pos: "CA", x: 50, y: 30 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "VOL", x: 38, y: 60 },
      { pos: "MC", x: 62, y: 60 },
      { pos: "PE", x: 18, y: 45 },
      { pos: "MEI", x: 50, y: 43 },
      { pos: "PD", x: 82, y: 45 },
      { pos: "CA", x: 50, y: 22 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 85, y: 62 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 15, y: 62 },
      { pos: "MC", x: 38, y: 53 },
      { pos: "MC", x: 62, y: 53 },
      { pos: "PE", x: 15, y: 38 },
      { pos: "MEI", x: 50, y: 36 },
      { pos: "PD", x: 85, y: 38 },
      { pos: "CA", x: 50, y: 17 },
    ],
  },
  "4-2-4": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "VOL", x: 38, y: 65 },
      { pos: "VOL", x: 62, y: 65 },
      { pos: "PE", x: 15, y: 28 },
      { pos: "CA", x: 38, y: 24 },
      { pos: "CA", x: 62, y: 24 },
      { pos: "PD", x: 85, y: 28 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "MC", x: 38, y: 58 },
      { pos: "MC", x: 62, y: 58 },
      { pos: "PE", x: 15, y: 24 },
      { pos: "CA", x: 38, y: 20 },
      { pos: "CA", x: 62, y: 20 },
      { pos: "PD", x: 85, y: 24 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 85, y: 67 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 15, y: 67 },
      { pos: "MC", x: 40, y: 55 },
      { pos: "MEI", x: 60, y: 50 },
      { pos: "PE", x: 12, y: 22 },
      { pos: "CA", x: 38, y: 17 },
      { pos: "CA", x: 62, y: 17 },
      { pos: "PD", x: 88, y: 22 },
    ],
  },
  "3-5-2": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 78 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 28, y: 78 },
      { pos: "MD", x: 84, y: 60 },
      { pos: "VOL", x: 62, y: 61 },
      { pos: "VOL", x: 38, y: 61 },
      { pos: "ME", x: 16, y: 60 },
      { pos: "MEI", x: 50, y: 45 },
      { pos: "CA", x: 40, y: 22 },
      { pos: "CA", x: 60, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 28, y: 77 },
      { pos: "MD", x: 84, y: 55 },
      { pos: "MC", x: 62, y: 55 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 38, y: 55 },
      { pos: "ME", x: 16, y: 55 },
      { pos: "CA", x: 40, y: 20 },
      { pos: "CA", x: 60, y: 20 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 75, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 25, y: 77 },
      { pos: "MD", x: 88, y: 48 },
      { pos: "MC", x: 62, y: 54 },
      { pos: "MC", x: 38, y: 54 },
      { pos: "ME", x: 12, y: 48 },
      { pos: "MEI", x: 50, y: 38 },
      { pos: "CA", x: 40, y: 18 },
      { pos: "CA", x: 60, y: 18 },
    ],
  },
  "5-3-2": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 86, y: 74 },
      { pos: "ZAG", x: 68, y: 78 },
      { pos: "ZAG", x: 50, y: 80 },
      { pos: "ZAG", x: 32, y: 78 },
      { pos: "LE", x: 14, y: 74 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 35, y: 52 },
      { pos: "MC", x: 65, y: 52 },
      { pos: "CA", x: 40, y: 22 },
      { pos: "CA", x: 60, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 86, y: 70 },
      { pos: "ZAG", x: 68, y: 77 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 32, y: 77 },
      { pos: "LE", x: 14, y: 70 },
      { pos: "VOL", x: 50, y: 60 },
      { pos: "MC", x: 36, y: 50 },
      { pos: "MEI", x: 64, y: 50 },
      { pos: "CA", x: 40, y: 20 },
      { pos: "CA", x: 60, y: 20 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 88, y: 64 },
      { pos: "ZAG", x: 68, y: 77 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 32, y: 77 },
      { pos: "LE", x: 12, y: 64 },
      { pos: "MC", x: 50, y: 58 },
      { pos: "MC", x: 35, y: 48 },
      { pos: "MEI", x: 65, y: 48 },
      { pos: "CA", x: 40, y: 18 },
      { pos: "CA", x: 60, y: 18 },
    ],
  },
  "4-5-1": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "MD", x: 82, y: 58 },
      { pos: "VOL", x: 62, y: 60 },
      { pos: "VOL", x: 38, y: 60 },
      { pos: "ME", x: 18, y: 58 },
      { pos: "MEI", x: 50, y: 44 },
      { pos: "CA", x: 50, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "MD", x: 82, y: 54 },
      { pos: "MC", x: 62, y: 56 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 38, y: 56 },
      { pos: "ME", x: 18, y: 54 },
      { pos: "CA", x: 50, y: 22 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 84, y: 70 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 16, y: 70 },
      { pos: "MD", x: 86, y: 48 },
      { pos: "MC", x: 62, y: 55 },
      { pos: "MC", x: 38, y: 55 },
      { pos: "ME", x: 14, y: 48 },
      { pos: "MEI", x: 50, y: 40 },
      { pos: "CA", x: 50, y: 18 },
    ],
  },
  "3-4-3": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 78 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 28, y: 78 },
      { pos: "MD", x: 84, y: 60 },
      { pos: "VOL", x: 60, y: 61 },
      { pos: "VOL", x: 40, y: 61 },
      { pos: "ME", x: 16, y: 60 },
      { pos: "PD", x: 78, y: 26 },
      { pos: "CA", x: 50, y: 20 },
      { pos: "PE", x: 22, y: 26 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 28, y: 77 },
      { pos: "MD", x: 86, y: 55 },
      { pos: "MC", x: 60, y: 55 },
      { pos: "MC", x: 40, y: 55 },
      { pos: "ME", x: 14, y: 55 },
      { pos: "PD", x: 78, y: 23 },
      { pos: "CA", x: 50, y: 17 },
      { pos: "PE", x: 22, y: 23 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 75, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 25, y: 77 },
      { pos: "ME", x: 8, y: 28 },
      { pos: "MC", x: 35, y: 47 },
      { pos: "MEI", x: 65, y: 47 },
      { pos: "MD", x: 92, y: 28 },
      { pos: "PE", x: 20, y: 17 },
      { pos: "CA", x: 50, y: 14 },
      { pos: "PD", x: 80, y: 17 },
    ],
  },
};

const attackWeights: Record<Position, number> = {
  GOL: 0,
  LD: 0,
  ZAG: 0,
  LE: 0,
  MD: 0.5,
  ME: 0.5,
  VOL: 0.2,
  MC: 0.5,
  MEI: 0.8,
  PD: 1,
  CA: 1,
  PE: 1,
};

const defenseWeights: Record<Position, number> = {
  GOL: 1,
  LD: 1,
  ZAG: 1,
  LE: 1,
  MD: 0.5,
  ME: 0.5,
  VOL: 0.8,
  MC: 0.5,
  MEI: 0.2,
  PD: 0,
  CA: 0,
  PE: 0,
};

const tournamentGroups = "ABCDEFGHIJKL".split("");
const thirdPlaceSlots = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"] as const;

const thirdPlaceAssignmentRows = `EJIFHGLKHGIDJFLKEJIDHGLKEJIDHFLKEGIDJFLKEGJDHFLKEGIDHFLKEGJDHFLIEGJDHFIKHGICJFLKEJICHGLKEJICHFLKEGICJFLKEGJCHFLKEGICHFLK
EGJCHFLIEGJCHFIKHGICJDLKCJIDHFLKCGIDJFLKCGJDHFLKCGIDHFLKCGJDHFLICGJDHFIKEJICHDLKEGICJDLKEGJCHDLKEGICHDLKEGJCHDLIEGJCHDIK
CJEDIFLKCJEDHFLKCEIDHFLKCJEDHFLICJEDHFIKCGEDJFLKCGEDIFLKCGEDJFLICGEDJFIKCGEDHFLKCGJDHFLECGJDHFEKCGEDHFLICGEDHFIKCGJDHFEI
HJBFIGLKEJIBHGLKEJBFIHLKEJBFIGLKEJBFHGLKEGBFIHLKEJBFHGLIEJBFHGIKHJBDIGLKHJBDIFLKIGBDJFLKHGBDJFLKHGBDIFLKHGBDJFLIHGBDJFIK
EJBDIHLKEJBDIGLKEJBDHGLKEGBDIHLKEJBDHGLIEJBDHGIKEJBDIFLKEJBDHFLKEIBDHFLKEJBDHFLIEJBDHFIKEGBDJFLKEGBDIFLKEGBDJFLIEGBDJFIK
EGBDHFLKHGBDJFLEHGBDJFEKEGBDHFLIEGBDHFIKHGBDJFEIHJBCIGLKHJBCIFLKIGBCJFLKHGBCJFLKHGBCIFLKHGBCJFLIHGBCJFIKEJBCIHLKEJBCIGLK
EJBCHGLKEGBCIHLKEJBCHGLIEJBCHGIKEJBCIFLKEJBCHFLKEIBCHFLKEJBCHFLIEJBCHFIKEGBCJFLKEGBCIFLKEGBCJFLIEGBCJFIKEGBCHFLKHGBCJFLE
HGBCJFEKEGBCHFLIEGBCHFIKHGBCJFEIHJBCIDLKIGBCJDLKHGBCJDLKHGBCIDLKHGBCJDLIHGBCJDIKCJBDIFLKCJBDHFLKCIBDHFLKCJBDHFLICJBDHFIK
CGBDJFLKCGBDIFLKCGBDJFLICGBDJFIKCGBDHFLKCGBDHFLJHGBCJFDKCGBDHFLICGBDHFIKHGBCJFDIEJBCIDLKEJBCHDLKEIBCHDLKEJBCHDLIEJBCHDIK
EGBCJDLKEGBCIDLKEGBCJDLIEGBCJDIKEGBCHDLKHGBCJDLEHGBCJDEKEGBCHDLIEGBCHDIKHGBCJDEICJBDEFLKCEBDIFLKCJBDEFLICJBDEFIKCEBDHFLK
CJBDHFLECJBDHFEKCEBDHFLICEBDHFIKCJBDHFEICGBDEFLKCGBDJFLECGBDJFEKCGBDEFLICGBDEFIKCGBDJFEICGBDHFLECGBDHFEKHGBCJFDECGBDHFEI
HJIFAGLKEJIAHGLKEJIFAHLKEJIFAGLKEGJFAHLKEGIFAHLKEGJFAHLIEGJFAHIKHJIDAGLKHJIDAFLKIGJDAFLKHGJDAFLKHGIDAFLKHGJDAFLIHGJDAFIK
EJIDAHLKEJIDAGLKEGJDAHLKEGIDAHLKEGJDAHLIEGJDAHIKEJIDAFLKHJEDAFLKHEIDAFLKHJEDAFLIHJEDAFIKEGJDAFLKEGIDAFLKEGJDAFLIEGJDAFIK
HGEDAFLKHGJDAFLEHGJDAFEKHGEDAFLIHGEDAFIKHGJDAFEIHJICAGLKHJICAFLKIGJCAFLKHGJCAFLKHGICAFLKHGJCAFLIHGJCAFIKEJICAHLKEJICAGLK
EGJCAHLKEGICAHLKEGJCAHLIEGJCAHIKEJICAFLKHJECAFLKHEICAFLKHJECAFLIHJECAFIKEGJCAFLKEGICAFLKEGJCAFLIEGJCAFIKHGECAFLKHGJCAFLE
HGJCAFEKHGECAFLIHGECAFIKHGJCAFEIHJICADLKIGJCADLKHGJCADLKHGICADLKHGJCADLIHGJCADIKCJIDAFLKHJFCADLKHFICADLKHJFCADLIHJFCADIK
CGJDAFLKCGIDAFLKCGJDAFLICGJDAFIKHGFCADLKCGJDAFLHHGJCAFDKHGFCADLIHGFCADIKHGJCAFDIEJICADLKHJECADLKHEICADLKHJECADLIHJECADIK
EGJCADLKEGICADLKEGJCADLIEGJCADIKHGECADLKHGJCADLEHGJCADEKHGECADLIHGECADIKHGJCADEICJEDAFLKCEIDAFLKCJEDAFLICJEDAFIKHEFCADLK
HJFCADLEHJECAFDKHEFCADLIHEFCADIKHJECAFDICGEDAFLKCGJDAFLECGJDAFEKCGEDAFLICGEDAFIKCGJDAFEIHGFCADLEHGECAFDKHGJCAFDEHGECAFDI
HJBAIGLKHJBAIFLKIJBFAGLKHJBFAGLKHGBAIFLKHJBFAGLIHJBFAGIKEJBAIHLKEJBAIGLKEJBAHGLKEGBAIHLKEJBAHGLIEJBAHGIKEJBAIFLKEJBFAHLK
EIBFAHLKEJBFAHLIEJBFAHIKEJBFAGLKEGBAIFLKEJBFAGLIEJBFAGIKEGBFAHLKHJBFAGLEHJBFAGEKEGBFAHLIEGBFAHIKHJBFAGEIIJBDAHLKIJBDAGLK
HJBDAGLKIGBDAHLKHJBDAGLIHJBDAGIKIJBDAFLKHJBDAFLKHIBDAFLKHJBDAFLIHJBDAFIKFJBDAGLKIGBDAFLKFJBDAGLIFJBDAGIKHGBDAFLKHGBDAFLJ
HGBDAFJKHGBDAFLIHGBDAFIKHGBDAFIJEJBAIDLKEJBDAHLKEIBDAHLKEJBDAHLIEJBDAHIKEJBDAGLKEGBAIDLKEJBDAGLIEJBDAGIKEGBDAHLKHJBDAGLE
HJBDAGEKEGBDAHLIEGBDAHIKHJBDAGEIEJBDAFLKEIBDAFLKEJBDAFLIEJBDAFIKHEBDAFLKHJBDAFLEHJBDAFEKHEBDAFLIHEBDAFIKHJBDAFEIEGBDAFLK
EGBDAFLJEGBDAFJKEGBDAFLIEGBDAFIKEGBDAFIJHGBDAFLEHGBDAFEKHGBDAFEJHGBDAFEIIJBCAHLKIJBCAGLKHJBCAGLKIGBCAHLKHJBCAGLIHJBCAGIK
IJBCAFLKHJBCAFLKHIBCAFLKHJBCAFLIHJBCAFIKCJBFAGLKIGBCAFLKCJBFAGLICJBFAGIKHGBCAFLKHGBCAFLJHGBCAFJKHGBCAFLIHGBCAFIKHGBCAFIJ
EJBAICLKEJBCAHLKEIBCAHLKEJBCAHLIEJBCAHIKEJBCAGLKEGBAICLKEJBCAGLIEJBCAGIKEGBCAHLKHJBCAGLEHJBCAGEKEGBCAHLIEGBCAHIKHJBCAGEI
EJBCAFLKEIBCAFLKEJBCAFLIEJBCAFIKHEBCAFLKHJBCAFLEHJBCAFEKHEBCAFLIHEBCAFIKHJBCAFEIEGBCAFLKEGBCAFLJEGBCAFJKEGBCAFLIEGBCAFIK
EGBCAFIJHGBCAFLEHGBCAFEKHGBCAFEJHGBCAFEIIJBCADLKHJBCADLKHIBCADLKHJBCADLIHJBCADIKCJBDAGLKIGBCADLKCJBDAGLICJBDAGIKHGBCADLK
HGBCADLJHGBCADJKHGBCADLIHGBCADIKHGBCADIJCJBDAFLKCIBDAFLKCJBDAFLICJBDAFIKHFBCADLKCJBDAFLHHJBCAFDKHFBCADLIHFBCADIKHJBCAFDI
CGBDAFLKCGBDAFLJCGBDAFJKCGBDAFLICGBDAFIKCGBDAFIJCGBDAFLHHGBCAFDKHGBCAFDJHGBCAFDIEJBCADLKEIBCADLKEJBCADLIEJBCADIKHEBCADLK
HJBCADLEHJBCADEKHEBCADLIHEBCADIKHJBCADEIEGBCADLKEGBCADLJEGBCADJKEGBCADLIEGBCADIKEGBCADIJHGBCADLEHGBCADEKHGBCADEJHGBCADEI
CEBDAFLKCJBDAFLECJBDAFEKCEBDAFLICEBDAFIKCJBDAFEIHFBCADLEHEBCAFDKHJBCAFDEHEBCAFDICGBDAFLECGBDAFEKCGBDAFEJCGBDAFEIHGBCAFDE`;
const thirdPlaceAssignments = thirdPlaceAssignmentRows.replace(/\s/g, "");

function combinations<T>(values: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (values.length < size) return [];
  const [head, ...tail] = values;
  return [
    ...combinations(tail, size - 1).map((item) => [head as T, ...item]),
    ...combinations(tail, size),
  ];
}

const thirdPlaceRoundOf32Map = new Map(
  combinations(tournamentGroups, 4).map((excluded, index) => {
    const qualified = tournamentGroups.filter((group) => !excluded.includes(group)).join("");
    return [qualified, thirdPlaceAssignments.slice(index * 8, index * 8 + 8).split("")];
  }),
);

export function createDraft(seed: string, options: DraftOptions = defaultOptions): Draft {
  return {
    seed,
    options,
    slots: formations[options.formation][options.style],
    filled: Array.from({ length: 11 }, () => null),
    current: null,
    rollIndex: 0,
    rerollsLeft: modeConfig[options.mode].rerolls,
    usedPlayerIds: [],
  };
}

export function playerKey(player: Pick<Player, "sel" | "copa" | "playerId">) {
  return `${player.sel}:${player.copa}:${player.playerId}`;
}

export async function fetchSquad(sel: string, copa: number): Promise<SquadFile> {
  const squad = squadFilesByKey.get(`${sel}:${copa}`);
  if (!squad) throw new Error(`Squad not indexed: ${sel}:${copa}`);
  return squad;
}

export function findSquadMeta(sel: string, copa: number) {
  return squadIndex.find((item) => item.sel === sel && item.copa === copa);
}

export function hashSeed(input: string) {
  let hash = 0x6a09e667 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 0xcc9e2d51);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

export function rng(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state |= 0;
    let value = Math.imul((state = (state + 0x6d2b79f5) | 0) ^ (state >>> 15), 1 | state);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function pick<T>(random: () => number, values: T[]) {
  if (values.length === 0) throw new Error("Cannot pick from an empty array");
  return values[Math.floor(random() * values.length)] as T;
}

export function rollPair(seed: string, rollIndex: number, avoid: Array<{ sel: string; copa: number }> = []) {
  const random = rng(`${seed.toUpperCase()}:roll:${rollIndex}`);
  const avoidKeys = new Set(avoid.map((item) => `${item.sel}:${item.copa}`));
  const pool = squadIndex.filter((item) => !avoidKeys.has(`${item.sel}:${item.copa}`));
  return pick(random, pool.length ? pool : squadIndex);
}

export function rerollPair(
  seed: string,
  base: { sel: string; copa: number },
  axis: "sel" | "copa",
  rerollNo: number,
) {
  const random = rng(`${seed.toUpperCase()}:reroll:${axis}:${rerollNo}:${base.sel}:${base.copa}`);
  if (axis === "sel") {
    const pool = squadIndex.filter((item) => item.copa === base.copa && item.sel !== base.sel);
    return pick(random, pool);
  }
  const pool = squadIndex.filter((item) => item.sel === base.sel && item.copa !== base.copa);
  return pick(random, pool.length ? pool : squadIndex.filter((item) => item.sel !== base.sel));
}

export function fitsSlot(player: Player, slot: Slot) {
  return player.positions.includes(slot.pos);
}

export function availablePositions(draft: Draft, player: Player) {
  return draft.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot, index }) => draft.filled[index] === null && fitsSlot(player, slot));
}

export function canFillAnySlot(draft: Draft, player: Player) {
  return availablePositions(draft, player).length > 0;
}

export function calculateStats(draftOrPlayers: Draft | Array<Player | null>, slots?: Slot[]): TeamStats {
  const filled = Array.isArray(draftOrPlayers) ? draftOrPlayers : draftOrPlayers.filled;
  const useSlots = slots ?? (Array.isArray(draftOrPlayers) ? formations["4-3-3"].equilibrado : draftOrPlayers.slots);
  let attack = 0;
  let attackWeight = 0;
  let defense = 0;
  let defenseWeight = 0;
  let overall = 0;
  let count = 0;

  useSlots.forEach((slot, index) => {
    const player = filled[index];
    const attackSlotWeight = attackWeights[slot.pos];
    const defenseSlotWeight = defenseWeights[slot.pos];
    attackWeight += attackSlotWeight;
    defenseWeight += defenseSlotWeight;
    if (!player) return;
    attack += player.force * attackSlotWeight;
    defense += player.force * defenseSlotWeight;
    overall += player.force;
    count += 1;
  });

  return {
    attack: attackWeight > 0 ? Math.round(attack / attackWeight) : 0,
    defense: defenseWeight > 0 ? Math.round(defense / defenseWeight) : 0,
    overall: count > 0 ? Math.round(overall / count) : 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lambda(a: number, b: number) {
  return clamp(1.4 + (a - b) * 0.08, 0.15, 5);
}

function poisson(random: () => number, expected: number) {
  if (expected <= 0) return 0;
  const limit = Math.exp(-expected);
  let count = 0;
  let product = 1;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

function weightedGoalScorers(random: () => number, squad: Player[], goals: number) {
  if (goals <= 0) return [];
  const out: string[] = [];
  const weights = squad.map((player) => {
    if (player.positions.includes("GOL")) return 0.02 * player.force;
    if (player.positions.some((position) => ["PD", "PE", "CA"].includes(position))) return 1.2 * player.force;
    if (player.positions.some((position) => ["MEI", "MC", "MD", "ME"].includes(position))) return 0.7 * player.force;
    return 0.25 * player.force;
  });
  for (let goal = 0; goal < goals; goal += 1) {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let marker = random() * total;
    let index = 0;
    for (; index < weights.length - 1; index += 1) {
      marker -= weights[index] ?? 0;
      if (marker <= 0) break;
    }
    out.push(squad[index]?.name ?? "?");
    weights[index] = (weights[index] ?? 0) * 0.45;
  }
  return out;
}

function goalMinutes(random: () => number, me: string[], them: string[]) {
  const all = [
    ...me.map((name) => ({ name, side: "me" as const })),
    ...them.map((name) => ({ name, side: "them" as const })),
  ];
  const minutes = new Set<number>();
  return all
    .map((goal) => {
      let minute = 1 + Math.floor(90 * Math.pow(random(), 0.85));
      while (minutes.has(minute)) minute = Math.min(90, minute + 1);
      minutes.add(minute);
      return { minute, ...goal };
    })
    .sort((a, b) => a.minute - b.minute);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function penaltyShootoutCutoff(me: number[], them: number[]) {
  let meScore = 0;
  let themScore = 0;
  const rounds = me.length;
  for (let index = 0; index < rounds; index += 1) {
    meScore += me[index] ?? 0;
    if (meScore > themScore + (rounds - index)) return { meCount: index + 1, themCount: index };
    themScore += them[index] ?? 0;
    const remaining = rounds - 1 - index;
    if (meScore > themScore + remaining || themScore > meScore + remaining) {
      return { meCount: index + 1, themCount: index + 1 };
    }
  }
  return { meCount: rounds, themCount: rounds };
}

function penaltyTakerNames(squad: Player[], count: number) {
  if (count <= 0 || squad.length === 0) return undefined;
  const ordered = [...squad].sort((left, right) => {
    const leftGoalkeeper = Number(left.positions.includes("GOL"));
    const rightGoalkeeper = Number(right.positions.includes("GOL"));
    return leftGoalkeeper - rightGoalkeeper || right.force - left.force;
  });
  return Array.from({ length: count }, (_, index) => ordered[index % ordered.length]?.name ?? "?");
}

function penalties(random: () => number, advanced: boolean, meSquad: Player[], themSquad: Player[]): PenaltyResult {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const me = Array.from({ length: 5 }, () => +(random() < 0.78));
    const them = Array.from({ length: 5 }, () => +(random() < 0.78));
    const meScore = sum(me);
    const themScore = sum(them);
    const expectedWinnerScore = advanced ? meScore : themScore;
    const expectedLoserScore = advanced ? themScore : meScore;
    if (expectedWinnerScore > expectedLoserScore) {
      const cutoff = penaltyShootoutCutoff(me, them);
      return {
        me: me.slice(0, cutoff.meCount),
        them: them.slice(0, cutoff.themCount),
        score: `${meScore}-${themScore}`,
        meNames: penaltyTakerNames(meSquad, cutoff.meCount),
        themNames: penaltyTakerNames(themSquad, cutoff.themCount),
      };
    }
    if (meScore === themScore) {
      const sdMe: number[] = [];
      const sdThem: number[] = [];
      let liveMeScore = meScore;
      let liveThemScore = themScore;
      for (let round = 0; liveMeScore === liveThemScore && round < 5; round += 1) {
        const meKick = +(random() < 0.78);
        const themKick = +(random() < 0.78);
        if (meKick !== themKick) {
          const winnerKick = +advanced;
          const loserKick = +!advanced;
          sdMe.push(winnerKick);
          sdThem.push(loserKick);
          liveMeScore += winnerKick;
          liveThemScore += loserKick;
        } else {
          sdMe.push(meKick);
          sdThem.push(themKick);
          liveMeScore += meKick;
          liveThemScore += themKick;
        }
      }
      if (liveMeScore === liveThemScore) {
        const winnerKick = +advanced;
        const loserKick = +!advanced;
        sdMe.push(winnerKick);
        sdThem.push(loserKick);
        liveMeScore += winnerKick;
        liveThemScore += loserKick;
      }
      return {
        me,
        them,
        score: `${liveMeScore}-${liveThemScore}`,
        meNames: penaltyTakerNames(meSquad, me.length),
        themNames: penaltyTakerNames(themSquad, them.length),
        sd: {
          me: sdMe,
          them: sdThem,
          meNames: penaltyTakerNames(meSquad, me.length + sdMe.length)?.slice(me.length),
          themNames: penaltyTakerNames(themSquad, them.length + sdThem.length)?.slice(them.length),
        },
      };
    }
  }
  return advanced
    ? { me: [1], them: [0], score: "1-0", meNames: penaltyTakerNames(meSquad, 1), themNames: penaltyTakerNames(themSquad, 1) }
    : { me: [0], them: [1], score: "0-1", meNames: penaltyTakerNames(meSquad, 1), themNames: penaltyTakerNames(themSquad, 1) };
}


interface InternalTournamentTeam extends TournamentTeam {
  squad: Player[];
  tieBreak: number;
}

type TeamReference =
  | { type: "rank"; group: string; rank: 1 | 2 | 3 }
  | { type: "winner"; matchId: number }
  | { type: "loser"; matchId: number };

interface KnockoutDefinition {
  id: number;
  stage: TournamentStage;
  home: TeamReference;
  away: TeamReference;
}

function groupRankRef(group: string, rank: 1 | 2 | 3): TeamReference {
  return { type: "rank", group, rank };
}

function winnerRef(matchId: number): TeamReference {
  return { type: "winner", matchId };
}

function loserRef(matchId: number): TeamReference {
  return { type: "loser", matchId };
}

const roundOf32Definitions: KnockoutDefinition[] = [
  { id: 73, stage: "ROUND_OF_32", home: groupRankRef("A", 2), away: groupRankRef("B", 2) },
  { id: 74, stage: "ROUND_OF_32", home: groupRankRef("E", 1), away: groupRankRef("E", 3) },
  { id: 75, stage: "ROUND_OF_32", home: groupRankRef("F", 1), away: groupRankRef("C", 2) },
  { id: 76, stage: "ROUND_OF_32", home: groupRankRef("C", 1), away: groupRankRef("F", 2) },
  { id: 77, stage: "ROUND_OF_32", home: groupRankRef("I", 1), away: groupRankRef("I", 3) },
  { id: 78, stage: "ROUND_OF_32", home: groupRankRef("E", 2), away: groupRankRef("I", 2) },
  { id: 79, stage: "ROUND_OF_32", home: groupRankRef("A", 1), away: groupRankRef("A", 3) },
  { id: 80, stage: "ROUND_OF_32", home: groupRankRef("L", 1), away: groupRankRef("L", 3) },
  { id: 81, stage: "ROUND_OF_32", home: groupRankRef("D", 1), away: groupRankRef("D", 3) },
  { id: 82, stage: "ROUND_OF_32", home: groupRankRef("G", 1), away: groupRankRef("G", 3) },
  { id: 83, stage: "ROUND_OF_32", home: groupRankRef("K", 2), away: groupRankRef("L", 2) },
  { id: 84, stage: "ROUND_OF_32", home: groupRankRef("H", 1), away: groupRankRef("J", 2) },
  { id: 85, stage: "ROUND_OF_32", home: groupRankRef("B", 1), away: groupRankRef("B", 3) },
  { id: 86, stage: "ROUND_OF_32", home: groupRankRef("J", 1), away: groupRankRef("H", 2) },
  { id: 87, stage: "ROUND_OF_32", home: groupRankRef("K", 1), away: groupRankRef("K", 3) },
  { id: 88, stage: "ROUND_OF_32", home: groupRankRef("D", 2), away: groupRankRef("G", 2) },
];

const laterKnockoutDefinitions: KnockoutDefinition[] = [
  { id: 89, stage: "ROUND_OF_16", home: winnerRef(74), away: winnerRef(77) },
  { id: 90, stage: "ROUND_OF_16", home: winnerRef(73), away: winnerRef(75) },
  { id: 91, stage: "ROUND_OF_16", home: winnerRef(76), away: winnerRef(78) },
  { id: 92, stage: "ROUND_OF_16", home: winnerRef(79), away: winnerRef(80) },
  { id: 93, stage: "ROUND_OF_16", home: winnerRef(83), away: winnerRef(84) },
  { id: 94, stage: "ROUND_OF_16", home: winnerRef(81), away: winnerRef(82) },
  { id: 95, stage: "ROUND_OF_16", home: winnerRef(86), away: winnerRef(88) },
  { id: 96, stage: "ROUND_OF_16", home: winnerRef(85), away: winnerRef(87) },
  { id: 97, stage: "QUARTERFINAL", home: winnerRef(89), away: winnerRef(90) },
  { id: 98, stage: "QUARTERFINAL", home: winnerRef(93), away: winnerRef(94) },
  { id: 99, stage: "QUARTERFINAL", home: winnerRef(91), away: winnerRef(92) },
  { id: 100, stage: "QUARTERFINAL", home: winnerRef(95), away: winnerRef(96) },
  { id: 101, stage: "SEMIFINAL", home: winnerRef(97), away: winnerRef(98) },
  { id: 102, stage: "SEMIFINAL", home: winnerRef(99), away: winnerRef(100) },
  { id: 103, stage: "THIRD_PLACE", home: loserRef(101), away: loserRef(102) },
  { id: 104, stage: "FINAL", home: winnerRef(101), away: winnerRef(102) },
];

function opponentLabel(opponent: Pick<SquadFile, "sel" | "copa"> | SquadMeta | undefined, fallback: string) {
  return opponent ? `${opponent.sel} ${opponent.copa}` : fallback;
}

function shuffle<T>(seed: string, values: T[]) {
  const random = rng(seed);
  const out = [...values];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [out[index], out[swapIndex]] = [out[swapIndex] as T, out[index] as T];
  }
  return out;
}

function fallbackOpponentMetas(seed: string, selected: Player[], count: number, loaded: Array<Pick<SquadFile, "sel" | "copa">> = []) {
  const random = rng(`${seed}:opponents`);
  const used = new Set([...selected.map((player) => `${player.sel}:${player.copa}`), ...loaded.map((item) => `${item.sel}:${item.copa}`)]);
  const metas: SquadMeta[] = [];
  while (metas.length < count && used.size < squadIndex.length) {
    const meta = squadIndex[Math.floor(random() * squadIndex.length)]!;
    const key = `${meta.sel}:${meta.copa}`;
    if (used.has(key)) continue;
    used.add(key);
    metas.push(meta);
  }
  return metas;
}

function squadStrength(squad: Player[]) {
  if (squad.length === 0) return 74;
  const top = [...squad].sort((left, right) => right.force - left.force).slice(0, 11);
  return Math.round(top.reduce((total, player) => total + player.force, 0) / top.length);
}

function splitOpponentStats(seed: string, overall: number) {
  const random = rng(seed);
  const tilt = Math.round((random() - 0.5) * 8);
  return {
    attack: clamp(overall + tilt, 45, 99),
    defense: clamp(overall - tilt, 45, 99),
  };
}

function makeOpponentTeam(
  seed: string,
  source: SquadFile | SquadMeta,
  squad: Player[],
  group: string,
  slot: number,
  index: number,
): InternalTournamentTeam {
  const overall = clamp(squad.length ? squadStrength(squad) : 68 + (hashSeed(`${seed}:${source.sel}:${source.copa}`) % 22), 45, 99);
  const stats = splitOpponentStats(`${seed}:team:${source.sel}:${source.copa}`, overall);
  const id = `${source.sel}:${source.copa}`;
  return {
    id,
    label: opponentLabel(source, `Rival ${index + 1}`),
    sel: source.sel,
    copa: source.copa,
    group,
    slot,
    overall,
    attack: stats.attack,
    defense: stats.defense,
    isUser: false,
    squad,
    tieBreak: hashSeed(`${seed}:team-tie:${id}`),
  };
}

function toTournamentTeam(team: InternalTournamentTeam): TournamentTeam {
  return {
    id: team.id,
    label: team.label,
    sel: team.sel,
    copa: team.copa,
    group: team.group,
    slot: team.slot,
    overall: team.overall,
    attack: team.attack,
    defense: team.defense,
    isUser: team.isUser,
  };
}

function buildTournamentTeams(seed: string, draft: Draft, opponentSquads: SquadFile[]) {
  const selected = draft.filled.filter(Boolean) as Player[];
  const stats = calculateStats(draft);
  const loadedUnique: SquadFile[] = [];
  const used = new Set(selected.map((player) => `${player.sel}:${player.copa}`));
  for (const squad of opponentSquads) {
    const key = `${squad.sel}:${squad.copa}`;
    if (used.has(key)) continue;
    used.add(key);
    loadedUnique.push(squad);
    if (loadedUnique.length >= 47) break;
  }
  const fallback = fallbackOpponentMetas(seed, selected, 47 - loadedUnique.length, loadedUnique);
  const opponentSources = [
    ...loadedUnique.map((squad) => ({ source: squad, squad: squad.squad })),
    ...fallback.map((meta) => ({ source: meta, squad: squadFilesByKey.get(`${meta.sel}:${meta.copa}`)?.squad ?? [] })),
  ].slice(0, 47);

  const slots = tournamentGroups.flatMap((group) => [1, 2, 3, 4].map((slot) => ({ group, slot })));
  const slotRandom = rng(`${seed}:tournament:user-slot`);
  const userSlotIndex = Math.floor(slotRandom() * slots.length);
  const shuffledOpponents = shuffle(`${seed}:tournament:field`, opponentSources);
  const teams: InternalTournamentTeam[] = [];
  let opponentIndex = 0;

  slots.forEach((slot, index) => {
    if (index === userSlotIndex) {
      teams.push({
        id: "USER",
        label: "Seu time",
        group: slot.group,
        slot: slot.slot,
        overall: stats.overall,
        attack: stats.attack,
        defense: stats.defense,
        isUser: true,
        squad: selected,
        tieBreak: hashSeed(`${seed}:team-tie:USER`),
      });
      return;
    }
    const opponent = shuffledOpponents[opponentIndex++];
    if (!opponent) throw new Error("Not enough opponent squads to build tournament");
    teams.push(makeOpponentTeam(seed, opponent.source, opponent.squad, slot.group, slot.slot, opponentIndex));
  });

  return teams;
}

function playTeamScore(random: () => number, home: InternalTournamentTeam, away: InternalTournamentTeam) {
  const homeScore = poisson(random, lambda(home.attack, away.defense));
  const awayScore = poisson(random, lambda(away.attack, home.defense));
  return { homeScore, awayScore };
}

function simulateTournamentMatch(
  seed: string,
  id: number,
  stage: TournamentStage,
  home: InternalTournamentTeam,
  away: InternalTournamentTeam,
  knockout: boolean,
  extra: Partial<Pick<TournamentMatch, "group" | "matchday">> = {},
): TournamentMatch {
  const random = rng(`${seed}:match:${id}`);
  const { homeScore, awayScore } = playTeamScore(random, home, away);
  let winnerTeamId: string | undefined;
  let loserTeamId: string | undefined;
  let penaltyResult: PenaltyResult | undefined;

  if (knockout) {
    if (homeScore > awayScore) {
      winnerTeamId = home.id;
      loserTeamId = away.id;
    } else if (awayScore > homeScore) {
      winnerTeamId = away.id;
      loserTeamId = home.id;
    } else {
      const homeStrength = (home.attack + home.defense) / 2;
      const awayStrength = (away.attack + away.defense) / 2;
      const homeChance = clamp(0.5 + (homeStrength - awayStrength) * 0.012, 0.1, 0.9);
      const homeAdvanced = random() < homeChance;
      winnerTeamId = homeAdvanced ? home.id : away.id;
      loserTeamId = homeAdvanced ? away.id : home.id;
      penaltyResult = penalties(rng(`${seed}:pen:${id}`), homeAdvanced, home.squad, away.squad);
    }
  }

  return {
    id,
    stage,
    ...extra,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore,
    awayScore,
    winnerTeamId,
    loserTeamId,
    penalties: penaltyResult,
    isUserMatch: home.isUser || away.isUser,
  };
}

function emptyStanding(teamId: string): Omit<TournamentStanding, "rank"> {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
    qualified: false,
  };
}

function applyStandingResult(row: Omit<TournamentStanding, "rank">, gf: number, ga: number) {
  row.played += 1;
  row.gf += gf;
  row.ga += ga;
  row.gd = row.gf - row.ga;
  if (gf > ga) {
    row.wins += 1;
    row.pts += 3;
  } else if (gf === ga) {
    row.draws += 1;
    row.pts += 1;
  } else {
    row.losses += 1;
  }
}

function compareStandings(seed: string, teamsById: Map<string, InternalTournamentTeam>) {
  return (left: Omit<TournamentStanding, "rank">, right: Omit<TournamentStanding, "rank">) => {
    if (right.pts !== left.pts) return right.pts - left.pts;
    if (right.gd !== left.gd) return right.gd - left.gd;
    if (right.gf !== left.gf) return right.gf - left.gf;
    const leftTie = teamsById.get(left.teamId)?.tieBreak ?? hashSeed(`${seed}:tie:${left.teamId}`);
    const rightTie = teamsById.get(right.teamId)?.tieBreak ?? hashSeed(`${seed}:tie:${right.teamId}`);
    return leftTie - rightTie;
  };
}

function calculateGroupStandings(
  seed: string,
  teamsById: Map<string, InternalTournamentTeam>,
  teamIds: string[],
  matches: TournamentMatch[],
): TournamentStanding[] {
  const table = new Map(teamIds.map((teamId) => [teamId, emptyStanding(teamId)]));
  matches.forEach((match) => {
    const home = table.get(match.homeTeamId);
    const away = table.get(match.awayTeamId);
    if (!home || !away) return;
    applyStandingResult(home, match.homeScore, match.awayScore);
    applyStandingResult(away, match.awayScore, match.homeScore);
  });
  return [...table.values()]
    .sort(compareStandings(seed, teamsById))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function getTeamByRank(groups: TournamentData["groups"], teamsById: Map<string, InternalTournamentTeam>, group: string, rank: 1 | 2 | 3) {
  const standing = groups.find((item) => item.group === group)?.standings[rank - 1];
  const team = standing ? teamsById.get(standing.teamId) : undefined;
  if (!team) throw new Error(`Missing team for ${rank}${group}`);
  return team;
}

function resolveReference(
  reference: TeamReference,
  groups: TournamentData["groups"],
  teamsById: Map<string, InternalTournamentTeam>,
  matchesById: Map<number, TournamentMatch>,
  thirdAssignments: Record<string, string>,
) {
  if (reference.type === "winner" || reference.type === "loser") {
    const match = matchesById.get(reference.matchId);
    const teamId = reference.type === "winner" ? match?.winnerTeamId : match?.loserTeamId;
    const team = teamId ? teamsById.get(teamId) : undefined;
    if (!team) throw new Error(`Missing ${reference.type} for match ${reference.matchId}`);
    return team;
  }
  if (reference.rank === 3) {
    const assignedGroup = thirdAssignments[`1${reference.group}`];
    if (!assignedGroup) throw new Error(`Missing third-place assignment for 1${reference.group}`);
    return getTeamByRank(groups, teamsById, assignedGroup, 3);
  }
  return getTeamByRank(groups, teamsById, reference.group, reference.rank);
}

function buildTournament(seed: string, draft: Draft, opponentSquads: SquadFile[]) {
  const teams = buildTournamentTeams(seed, draft, opponentSquads);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const matches: TournamentMatch[] = [];
  const matchesById = new Map<number, TournamentMatch>();
  const groupPairings = [
    { matchday: 1, pairs: [[1, 2], [3, 4]] },
    { matchday: 2, pairs: [[1, 3], [4, 2]] },
    { matchday: 3, pairs: [[4, 1], [2, 3]] },
  ] as const;
  let groupMatchId = 1;

  for (const group of tournamentGroups) {
    const groupTeams = teams.filter((team) => team.group === group).sort((left, right) => left.slot - right.slot);
    for (const round of groupPairings) {
      for (const [homeSlot, awaySlot] of round.pairs) {
        const home = groupTeams.find((team) => team.slot === homeSlot)!;
        const away = groupTeams.find((team) => team.slot === awaySlot)!;
        const match = simulateTournamentMatch(seed, groupMatchId++, "GROUP", home, away, false, {
          group,
          matchday: round.matchday,
        });
        matches.push(match);
        matchesById.set(match.id, match);
      }
    }
  }

  const groups = tournamentGroups.map((group) => {
    const teamIds = teams.filter((team) => team.group === group).sort((left, right) => left.slot - right.slot).map((team) => team.id);
    const groupMatches = matches.filter((match) => match.group === group);
    return {
      group,
      teamIds,
      matchIds: groupMatches.map((match) => match.id),
      standings: calculateGroupStandings(seed, teamsById, teamIds, groupMatches),
    };
  });

  const thirdPlaced = groups
    .map((group) => group.standings[2]!)
    .sort(compareStandings(seed, teamsById));
  const qualifiedThirdIds = new Set(thirdPlaced.slice(0, 8).map((row) => row.teamId));
  const qualifiedThirdGroups = tournamentGroups.filter((group) => {
    const third = groups.find((item) => item.group === group)?.standings[2];
    return third ? qualifiedThirdIds.has(third.teamId) : false;
  });
  const thirdAssignmentsList = thirdPlaceRoundOf32Map.get(qualifiedThirdGroups.join(""));
  if (!thirdAssignmentsList) throw new Error(`Missing third-place table row for ${qualifiedThirdGroups.join("")}`);
  const thirdPlaceAssignments = Object.fromEntries(thirdPlaceSlots.map((slot, index) => [slot, thirdAssignmentsList[index] as string]));

  groups.forEach((group) => {
    group.standings = group.standings.map((row) => {
      const qualified = row.rank <= 2 || qualifiedThirdIds.has(row.teamId);
      const thirdRank = row.rank === 3 ? thirdPlaced.findIndex((third) => third.teamId === row.teamId) + 1 : undefined;
      return { ...row, qualified, thirdRank: thirdRank || undefined };
    });
  });

  for (const definition of [...roundOf32Definitions, ...laterKnockoutDefinitions]) {
    const home = resolveReference(definition.home, groups, teamsById, matchesById, thirdPlaceAssignments);
    const away = resolveReference(definition.away, groups, teamsById, matchesById, thirdPlaceAssignments);
    const match = simulateTournamentMatch(seed, definition.id, definition.stage, home, away, true);
    matches.push(match);
    matchesById.set(match.id, match);
  }

  const userTeam = teams.find((team) => team.isUser)!;
  const tournament: TournamentData = {
    userTeamId: userTeam.id,
    userGroup: userTeam.group,
    teams: teams.map(toTournamentTeam),
    groups,
    matches,
    bracket: {
      roundOf32: roundOf32Definitions.map((match) => match.id),
      roundOf16: laterKnockoutDefinitions.filter((match) => match.stage === "ROUND_OF_16").map((match) => match.id),
      quarterfinals: laterKnockoutDefinitions.filter((match) => match.stage === "QUARTERFINAL").map((match) => match.id),
      semifinals: laterKnockoutDefinitions.filter((match) => match.stage === "SEMIFINAL").map((match) => match.id),
      thirdPlace: 103,
      final: 104,
    },
    qualifiedThirdGroups,
    thirdPlaceAssignments,
  };
  return { tournament, teamsById };
}

function stageLabel(stage: TournamentStage) {
  switch (stage) {
    case "GROUP":
      return "GRUPOS";
    case "ROUND_OF_32":
      return "16 AVOS";
    case "ROUND_OF_16":
      return "OITAVAS";
    case "QUARTERFINAL":
      return "QUARTAS";
    case "SEMIFINAL":
      return "SEMI";
    case "THIRD_PLACE":
      return "3O LUGAR";
    case "FINAL":
      return "FINAL";
  }
}

function flipPenaltyResult(result: PenaltyResult): PenaltyResult {
  const [home = "0", away = "0"] = result.score.split("-");
  return {
    score: `${away}-${home}`,
    me: result.them,
    them: result.me,
    meNames: result.themNames,
    themNames: result.meNames,
    sd: result.sd
      ? {
          me: result.sd.them,
          them: result.sd.me,
          meNames: result.sd.themNames,
          themNames: result.sd.meNames,
        }
      : undefined,
  };
}

function tournamentCampaign(seed: string, draft: Draft, tournament: TournamentData, teamsById: Map<string, InternalTournamentTeam>) {
  const selected = draft.filled.filter(Boolean) as Player[];
  const userGroup = tournament.groups.find((group) => group.group === tournament.userGroup);
  const finalGroupTable = userGroup?.standings.map((row) => {
    const team = teamsById.get(row.teamId)!;
    return {
      me: team.isUser,
      label: team.label,
      pts: row.pts,
      gd: row.gd,
      gf: row.gf,
    };
  });
  const userQualified = userGroup?.standings.some((row) => row.teamId === tournament.userTeamId && row.qualified) ?? false;

  return tournament.matches
    .filter((match) => match.isUserMatch)
    .sort((left, right) => left.id - right.id)
    .map((match, index): CampaignMatch => {
      const userIsHome = match.homeTeamId === tournament.userTeamId;
      const opponent = teamsById.get(userIsHome ? match.awayTeamId : match.homeTeamId)!;
      const gf = userIsHome ? match.homeScore : match.awayScore;
      const ga = userIsHome ? match.awayScore : match.homeScore;
      const userWon = match.winnerTeamId === tournament.userTeamId || (!match.winnerTeamId && gf > ga);
      const outcome = gf > ga ? "V" : gf < ga ? "D" : "E";
      const advanced = match.stage === "GROUP" ? (match.matchday === 3 ? userQualified : true) : userWon;
      const scorerRandom = rng(`${seed}:gols:${match.id}`);
      const scorers = weightedGoalScorers(scorerRandom, selected, gf);
      const conceded = weightedGoalScorers(scorerRandom, opponent.squad, ga);
      const penaltyResult = match.penalties ? (userIsHome ? match.penalties : flipPenaltyResult(match.penalties)) : undefined;
      return {
        matchId: match.id,
        phase: stageLabel(match.stage),
        opponent: opponent.label,
        opponentOverall: opponent.overall,
        gf,
        ga,
        outcome,
        advanced,
        penalties: penaltyResult,
        scorers,
        conceded,
        minutes: goalMinutes(rng(`${seed}:min:${index}`), scorers, conceded),
        groupTable: match.stage === "GROUP" && match.matchday === 3 ? finalGroupTable : undefined,
      };
    });
}

export function simulateCampaign(
  seed: string,
  draft: Draft,
  opponentSquads: SquadFile[] = [],
): SimResult {
  const { tournament, teamsById } = buildTournament(seed, draft, opponentSquads);
  const campaign = tournamentCampaign(seed, draft, tournament, teamsById);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;

  campaign.forEach((match) => {
    gf += match.gf;
    ga += match.ga;
    if (match.phase === "GRUPOS") {
      if (match.outcome === "V") wins += 1;
      else if (match.outcome === "E") draws += 1;
      else losses += 1;
      return;
    }
    if (match.advanced) wins += 1;
    else losses += 1;
  });

  const final = tournament.matches.find((match) => match.id === 104);
  const champion = final?.winnerTeamId === tournament.userTeamId;
  const perfect = champion && campaign.length === 8 && losses === 0;
  const badge = perfect && gf - ga >= 18 ? "ESMAGADOR DE RECORDES" : champion && ga === 0 ? "MURALHA" : null;
  return {
    record: `${wins}-${losses}`,
    champion,
    perfect,
    wins,
    draws,
    losses,
    gf,
    ga,
    campaign,
    tournament,
    badge,
  };
}

export function randomSeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0]!.toString(36);
  }
  return Math.floor(Math.random() * 0xffffffff).toString(36);
}

export function findPlayerInSquad(squad: SquadFile, playerId: string) {
  return squad.squad.find((player) => player.playerId === playerId);
}

export function describePair(sel: string, copa: number, locale: "pt" | "en" | "es") {
  return `${nationName(sel, locale)} ${copa}`;
}

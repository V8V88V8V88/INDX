import type { District } from "@/types";
import districts_an from "../../public/data/districts/an.json";
import districts_ap from "../../public/data/districts/ap.json";
import districts_ar from "../../public/data/districts/ar.json";
import districts_as from "../../public/data/districts/as.json";
import districts_br from "../../public/data/districts/br.json";
import districts_cg from "../../public/data/districts/cg.json";
import districts_ch from "../../public/data/districts/ch.json";
import districts_dd from "../../public/data/districts/dd.json";
import districts_dl from "../../public/data/districts/dl.json";
import districts_ga from "../../public/data/districts/ga.json";
import districts_gj from "../../public/data/districts/gj.json";
import districts_hp from "../../public/data/districts/hp.json";
import districts_hr from "../../public/data/districts/hr.json";
import districts_jh from "../../public/data/districts/jh.json";
import districts_jk from "../../public/data/districts/jk.json";
import districts_ka from "../../public/data/districts/ka.json";
import districts_kl from "../../public/data/districts/kl.json";
import districts_la from "../../public/data/districts/la.json";
import districts_ld from "../../public/data/districts/ld.json";
import districts_mh from "../../public/data/districts/mh.json";
import districts_ml from "../../public/data/districts/ml.json";
import districts_mn from "../../public/data/districts/mn.json";
import districts_mp from "../../public/data/districts/mp.json";
import districts_mz from "../../public/data/districts/mz.json";
import districts_nl from "../../public/data/districts/nl.json";
import districts_or from "../../public/data/districts/or.json";
import districts_pb from "../../public/data/districts/pb.json";
import districts_py from "../../public/data/districts/py.json";
import districts_rj from "../../public/data/districts/rj.json";
import districts_sk from "../../public/data/districts/sk.json";
import districts_tn from "../../public/data/districts/tn.json";
import districts_tr from "../../public/data/districts/tr.json";
import districts_ts from "../../public/data/districts/ts.json";
import districts_uk from "../../public/data/districts/uk.json";
import districts_up from "../../public/data/districts/up.json";
import districts_wb from "../../public/data/districts/wb.json";
import names_bn from "../../public/data/names/bn.json";
import names_gu from "../../public/data/names/gu.json";
import names_hi from "../../public/data/names/hi.json";
import names_kn from "../../public/data/names/kn.json";
import names_ml from "../../public/data/names/ml.json";
import names_mr from "../../public/data/names/mr.json";
import names_or from "../../public/data/names/or.json";
import names_pa from "../../public/data/names/pa.json";
import names_ta from "../../public/data/names/ta.json";
import names_te from "../../public/data/names/te.json";

export const districtFiles: Record<string, District[]> = {
  an: districts_an,
  ap: districts_ap,
  ar: districts_ar,
  as: districts_as,
  br: districts_br,
  cg: districts_cg,
  ch: districts_ch,
  dd: districts_dd,
  dl: districts_dl,
  ga: districts_ga,
  gj: districts_gj,
  hp: districts_hp,
  hr: districts_hr,
  jh: districts_jh,
  jk: districts_jk,
  ka: districts_ka,
  kl: districts_kl,
  la: districts_la,
  ld: districts_ld,
  mh: districts_mh,
  ml: districts_ml,
  mn: districts_mn,
  mp: districts_mp,
  mz: districts_mz,
  nl: districts_nl,
  or: districts_or,
  pb: districts_pb,
  py: districts_py,
  rj: districts_rj,
  sk: districts_sk,
  tn: districts_tn,
  tr: districts_tr,
  ts: districts_ts,
  uk: districts_uk,
  up: districts_up,
  wb: districts_wb,
};

export const placeNameFiles: Record<string, Record<string, Record<string, string>>> = {
  bn: names_bn,
  gu: names_gu,
  hi: names_hi,
  kn: names_kn,
  ml: names_ml,
  mr: names_mr,
  or: names_or,
  pa: names_pa,
  ta: names_ta,
  te: names_te,
};

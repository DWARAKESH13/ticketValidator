import { LABEL } from "../constants.js";

export default function Badge({ status }) {
  return <span className={`badge ${status}`}>{LABEL[status]}</span>;
}
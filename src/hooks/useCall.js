import { useContext } from "react";
import { CallContext } from "./CallContext";

export const useCall = () => useContext(CallContext);

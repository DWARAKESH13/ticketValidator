import { useEffect, useState } from "react";
import { KEY } from "../constants.js";

export default function useHistory() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(0, 1000)));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const add = (record) => setItems((prev) => [record, ...prev]);
  const clear = () => setItems([]);

  return [items, add, clear];
}
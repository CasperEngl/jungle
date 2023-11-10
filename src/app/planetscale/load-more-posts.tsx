"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

type Props = {
  onLoad: () => Promise<void>;
};

export function LoadMore({ onLoad }: Props) {
  const [ref, inView] = useInView();

  useEffect(() => {
    if (!inView) return;

    onLoad();
  }, [inView, onLoad]);

  return <div ref={ref} />;
}

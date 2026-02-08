"use client";


type ConditionAtomProps = {
  params?: any;
  children?: any;
};


export default function ConditionAtom({ params = {}, children }: ConditionAtomProps) {
  return params.if ? <>{children}</> : null;
}

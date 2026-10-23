"use client";
import { Fragment } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";
import { MORPHOLOGY_FIELDS, type CorpusWord } from "@/lib/corpus/types";
import { POS_CATEGORIES, wordCategory } from "@/lib/pos";

export function WordDetail({ word }: { word: CorpusWord }) {
  return (
    <>
      <div className="popover-heading">
        <h2 lang="grc">{word.text}</h2>
        <PopoverClose asChild>
          <Button aria-label="Close word details">
            <X size={16} />
          </Button>
        </PopoverClose>
      </div>
      <p>
        <span className="small-caps">Lemma</span>
        <br />
        <span lang="grc">{word.lemma}</span>
      </p>
      <p className="gloss">
        {word.gloss || "Gloss not supplied by the source."}
      </p>
      <dl>
        <dt>Part of speech</dt>
        <dd>
          {
            POS_CATEGORIES.find(
              (category) =>
                category.key === wordCategory(word.pos, word.m.mood),
            )?.label
          }
        </dd>
        {MORPHOLOGY_FIELDS.filter((field) => word.m[field]).map((field) => (
          <Fragment key={field}>
            <dt>{field}</dt>
            <dd>{word.m[field]}</dd>
          </Fragment>
        ))}
      </dl>
    </>
  );
}

"use client";
import { useState } from "react";
import {
  workspaceHandoff,
  type WorkspaceTool,
} from "@/lib/command/integrations";
import { Icon } from "../icon";
export function AssignmentTools({
  title,
  submitted = false,
}: {
  title: string;
  submitted?: boolean;
}) {
  const [tool, setTool] = useState<WorkspaceTool>("doc");
  return (
    <details className="assignment-tools">
      <summary>
        <Icon name="workspace" size={16} /> Work on this assignment
      </summary>
      <p className="small">
        {title} ·{" "}
        {submitted
          ? "Submission is already recorded. Opening an editor does not resubmit it."
          : "Choose a tool. Your Campus submission remains separate."}
      </p>
      <div className="toolbar">
        <label>
          Workspace tool
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value as WorkspaceTool)}
          >
            <option value="doc">Write · essay or reflection</option>
            <option value="sheet">Tables · data analysis</option>
            <option value="slides">Present · presentation</option>
          </select>
        </label>
        <a
          className="button secondary"
          href={workspaceHandoff(tool)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open{" "}
          {tool === "doc" ? "Write" : tool === "sheet" ? "Tables" : "Present"}
          <Icon name="external" size={15} />
        </a>
      </div>
      <p className="small">
        Opens a filtered file list in Workspace in a new tab. Select or create
        your own file there, then return to submit here. No content or
        credentials are transferred.
      </p>
    </details>
  );
}
export function StudyTools() {
  const [source, setSource] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [show, setShow] = useState(false);
  return (
    <details className="study-tools">
      <summary>
        <Icon name="intelligence" size={16} /> Source-linked study card
      </summary>
      <p className="small">
        Manual study tool · AI is not configured. Use published readings, never
        restricted assessment questions. Nothing is sent to a provider.
      </p>
      <div hidden={show}>
        <label>
          Reading or source reference
          <input
            maxLength={300}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <label>
          Your recall question
          <input
            maxLength={500}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
        <label>
          Your source-supported answer
          <textarea
            maxLength={2000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        className="secondary"
        disabled={!source.trim() || !question.trim() || !answer.trim()}
        onClick={() => setShow(!show)}
      >
        {show ? "Edit study card" : "Practise recall"}
      </button>
      {show && (
        <article className="study-card">
          <h3>{question}</h3>
          <details>
            <summary>Reveal your answer</summary>
            <p>{answer}</p>
          </details>
          <small>Source: {source} · Unsaved, this page only</small>
        </article>
      )}
    </details>
  );
}

"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import {
  analyzePortfolioImport,
  confirmPortfolioImport,
  type PortfolioImportCommitResult,
} from "@/app/(authenticated)/(org-required)/import/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ImportFunderDecision,
  PortfolioImportPreview,
  PortfolioImportPreviewRow,
} from "@/lib/import/portfolio-xlsx";

const ACKNOWLEDGEMENT_TEXT =
  "I reviewed the valid rows and understand that this import will create new GrantFlow grant records.";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayValue(value: string | null | undefined): string {
  return value ?? "—";
}

function stateLabel(row: PortfolioImportPreviewRow): string {
  if (row.state === "collapsed_duplicate") return "Collapsed duplicate";
  return row.state === "valid" ? "Valid" : "Excluded";
}

function stateVariant(row: PortfolioImportPreviewRow): "default" | "secondary" | "destructive" {
  if (row.state === "collapsed_duplicate") return "secondary";
  return row.state === "valid" ? "default" : "destructive";
}

function decisionLabel(decision: ImportFunderDecision | null): string {
  if (!decision) return "No funder decision";
  if (decision.kind === "create") return `Create ${decision.name}`;
  if (decision.kind === "reuse") return `Reuse ${decision.name}`;
  return `Ambiguous match for ${decision.name}`;
}

function HeaderList({ headers, emptyMessage }: { headers: string[]; emptyMessage: string }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  if (headers.length === 0) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  const visibleHeaders = expanded ? headers : headers.slice(0, 12);
  const remaining = headers.length - 12;

  return (
    <div className="flex flex-col gap-2">
      <div className={expanded ? "max-h-32 overflow-y-auto pr-1" : undefined}>
        <ul className="flex flex-wrap gap-2" aria-label="Headers">
          {visibleHeaders.map((header) => (
            <li key={header}>
              <Badge variant="outline">{header}</Badge>
            </li>
          ))}
        </ul>
      </div>
      {headers.length > 12 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="self-start text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
        >
          {expanded ? "Show less" : `Show ${remaining} more`}
        </button>
      )}
    </div>
  );
}

function CountTile({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "muted" | "danger" }): React.ReactNode {
  const valueClass = tone === "danger" ? "text-destructive" : tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-metric ${valueClass}`}>{value}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="min-w-0">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ImportRow({ row }: { row: PortfolioImportPreviewRow }): React.ReactNode {
  const rowTitle = row.grant?.title ?? row.funder?.name ?? "Unmapped workbook row";
  const amountSelection = [row.amountSelection.requestedSourceColumn, row.amountSelection.awardedSourceColumn]
    .filter(Boolean)
    .join("; ");

  return (
    <li>
      <article
        className={`rounded-lg border bg-card p-4 shadow-sm ${row.state === "invalid" ? "border-destructive/40" : "border-border"}`}
        aria-labelledby={`import-row-${row.sourceRowNumber}`}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-label text-muted-foreground">Source row {row.sourceRowNumber}</p>
            <h4 id={`import-row-${row.sourceRowNumber}`} className="mt-1 text-base font-semibold text-foreground">
              {rowTitle}
            </h4>
          </div>
          <Badge variant={stateVariant(row)}>{stateLabel(row)}</Badge>
        </header>

        <dl className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Funder" value={row.funder?.name ?? "—"} />
          <Detail label="Funder type" value={row.funder?.type ?? "—"} />
          <Detail label="Funder decision" value={decisionLabel(row.funderDecision)} />
          <Detail label="Status" value={row.grant ? row.grant.status : "—"} />
          <Detail label="Derived title" value={row.grant?.title ?? "Excluded"} />
          <Detail label="Requested amount" value={row.grant?.amountRequested ?? "—"} />
          <Detail label="Awarded amount" value={row.grant?.amountAwarded ?? "—"} />
          <Detail label="Selected amount columns" value={amountSelection || "No populated amount selected"} />
          <Detail label="Due date" value={displayValue(row.grant?.deadline)} />
          <Detail label="Decision date" value={displayValue(row.grant?.decisionDate)} />
          <Detail label="Designation" value={displayValue(row.grant?.designation)} />
          <Detail label="County served" value={displayValue(row.grant?.countyServed)} />
          <Detail label="Next steps" value={displayValue(row.grant?.nextSteps)} />
        </dl>

        {row.grant?.notes && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-label text-muted-foreground">Grant notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{row.grant.notes}</p>
          </div>
        )}

        {row.preservedSourceValues.length > 0 && (
          <div className="mt-4 rounded-md border border-border bg-background p-3">
            <h5 className="text-label text-muted-foreground">Preserved source values</h5>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
              {row.preservedSourceValues.map((sourceValue) => (
                <li key={`${sourceValue.sourceColumn}-${sourceValue.value}`}>
                  <span className="font-medium">{sourceValue.sourceColumn}:</span> {sourceValue.value}
                </li>
              ))}
            </ul>
          </div>
        )}

        {row.collapsedIntoSourceRow !== null && (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            This exact normalized row is represented by source row {row.collapsedIntoSourceRow} and will not create another Grant.
          </p>
        )}

        {row.collapsedSourceRows.length > 0 && (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Collapsed duplicate source rows: {row.collapsedSourceRows.join(", ")}.
          </p>
        )}

        {row.errors.length > 0 && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive-soft p-3 text-destructive" role="alert">
            <h5 className="text-label">Excluded because</h5>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {row.errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}

        {row.warnings.length > 0 && (
          <div className="mt-4 rounded-md border border-warning/40 bg-urgency-soon p-3 text-warning">
            <h5 className="text-label">Review warning</h5>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {row.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}
      </article>
    </li>
  );
}

function CompletionState({ result, onStartOver }: { result: PortfolioImportCommitResult; onStartOver: () => void }): React.ReactNode {
  const { counts } = result;
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="import-complete-title">
      <Badge variant="default">Import complete</Badge>
      <h1 id="import-complete-title" className="mt-4 text-title text-foreground">Your portfolio is ready</h1>
      <p className="mt-2 max-w-2xl text-base leading-6 text-muted-foreground">
        GrantFlow created the valid grants from the {result.worksheet} worksheet. The original workbook and preview were not retained.
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Import completion counts">
        <CountTile label="Funders created" value={counts.createdFunders} />
        <CountTile label="Funders reused" value={counts.reusedFunders} />
        <CountTile label="Grants created" value={counts.createdGrants} />
        <CountTile label="Duplicates collapsed" value={counts.collapsed} tone="muted" />
        <CountTile label="Rows excluded" value={counts.excluded} tone={counts.excluded > 0 ? "danger" : "muted"} />
        <CountTile label="Rows skipped" value={counts.structural} tone="muted" />
      </dl>

      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
        <Button asChild>
          <Link href="/grants">View grants</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/funders">View funders</Link>
        </Button>
        <Button type="button" variant="ghost" onClick={onStartOver}>Start another import</Button>
      </div>
    </section>
  );
}

function PreviewReport({
  preview,
  file,
  acknowledged,
  isConfirming,
  onAcknowledgementChange,
  onConfirm,
}: {
  preview: PortfolioImportPreview;
  file: File;
  acknowledged: boolean;
  isConfirming: boolean;
  onAcknowledgementChange: (checked: boolean) => void;
  onConfirm: (event: FormEvent<HTMLFormElement>) => void;
}): React.ReactNode {
  const canConfirm = preview.counts.valid > 0 && acknowledged && !isConfirming;

  return (
    <section className="mt-8 flex flex-col gap-6" aria-labelledby="import-preview-title">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline">Server-produced preview</Badge>
            <h2 id="import-preview-title" className="mt-3 text-h2 text-foreground">Review what GrantFlow recognized</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.fileName} · {preview.worksheet} · header row {preview.headerRowNumber}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)} selected</p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Import preview counts">
          <CountTile label="Structural / skipped" value={preview.counts.structural} tone="muted" />
          <CountTile label="Candidate rows" value={preview.counts.candidate} />
          <CountTile label="Valid rows" value={preview.counts.valid} />
          <CountTile label="Invalid / excluded" value={preview.counts.invalid} tone={preview.counts.invalid > 0 ? "danger" : "muted"} />
          <CountTile label="Collapsed duplicates" value={preview.counts.collapsed} tone="muted" />
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm" aria-labelledby="import-headers-title">
          <h3 id="import-headers-title" className="text-h2 text-foreground">Workbook recognition</h3>
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <h4 className="text-label text-muted-foreground">Recognized headers</h4>
              <div className="mt-2"><HeaderList headers={preview.recognizedHeaders} emptyMessage="No supported headers were recognized." /></div>
            </div>
            <div>
              <h4 className="text-label text-muted-foreground">Unsupported headers</h4>
              <div className="mt-2"><HeaderList headers={preview.unsupportedHeaders} emptyMessage="No unsupported headers found." /></div>
            </div>
            {preview.unsupportedSourceWarnings.length > 0 && (
              <div className="rounded-md border border-warning/40 bg-urgency-soon p-3 text-sm text-warning">
                <h4 className="font-semibold">Source values not used as fields</h4>
                <ul className="mt-2 flex flex-col gap-1">
                  {preview.unsupportedSourceWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sm" aria-labelledby="import-mapping-title">
          <h3 id="import-mapping-title" className="text-h2 text-foreground">Mapping decisions</h3>
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <h4 className="text-label text-muted-foreground">Status mapping</h4>
              <ul className="mt-2 flex flex-col gap-2 text-sm">
                {Object.entries(preview.statusMapping).map(([source, destination]) => (
                  <li key={source} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{source}</span>
                    <span className="text-muted-foreground" aria-hidden="true">→</span>
                    <Badge variant="secondary">{destination}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-label text-muted-foreground">Requested amount selection</h4>
              <p className="mt-1 text-sm text-foreground">{preview.requestedAmountOrder.join(" → ")}</p>
            </div>
            <div>
              <h4 className="text-label text-muted-foreground">Awarded amount selection</h4>
              <p className="mt-1 text-sm text-foreground">{preview.awardedAmountOrder.join(" → ")}</p>
            </div>
            <p className="rounded-md bg-muted p-3 text-sm leading-5 text-muted-foreground">
              Excel dates and strict YYYY-MM-DD text are normalized using the workbook date system. Bare numeric years, formulas, and invalid dates are excluded rather than guessed. Populated amount values that do not fit the selected fields remain in each row&apos;s labeled source-values note.
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="import-rows-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h3 id="import-rows-title" className="text-h2 text-foreground">Row decisions</h3>
            <p className="mt-1 text-sm text-muted-foreground">Each candidate row is shown with its server-side mapping and disposition.</p>
          </div>
          <p className="text-sm text-muted-foreground">Structural rows are counted above and skipped without becoming invalid Grants.</p>
        </div>
        {preview.rows.length > 0 ? (
          <ol className="mt-6 flex flex-col gap-4">
            {preview.rows.map((row) => <ImportRow key={`${row.sourceRowNumber}-${row.state}`} row={row} />)}
          </ol>
        ) : (
          <p className="mt-6 rounded-md bg-muted p-4 text-sm text-muted-foreground">No candidate rows were found in this workbook.</p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="import-confirm-title">
        <h3 id="import-confirm-title" className="text-h2 text-foreground">Confirm this import</h3>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
          Confirmation uploads this workbook again. GrantFlow will re-check authorization, mapping, funder matches, duplicate decisions, and row validity on the server before creating anything.
        </p>
        <div className="mt-4 rounded-md border border-warning/40 bg-urgency-soon p-3 text-sm leading-5 text-warning" role="alert">
          Deliberately importing the same workbook later can create additional Grant records. This confirmation is for this import only.
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={onConfirm}>
          <label className={`flex items-start gap-3 rounded-md border p-4 text-sm ${preview.counts.valid > 0 ? "border-border" : "border-border bg-muted text-muted-foreground"}`}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => onAcknowledgementChange(event.currentTarget.checked)}
              disabled={preview.counts.valid === 0 || isConfirming}
              className="mt-0.5 size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <span>{ACKNOWLEDGEMENT_TEXT}</span>
          </label>
          {preview.counts.valid === 0 && (
            <p className="text-sm text-destructive" role="status">No valid grants remain. Correct the workbook and analyze it again.</p>
          )}
          <div>
            <Button type="submit" disabled={!canConfirm} aria-disabled={!canConfirm}>
              {isConfirming ? "Importing…" : `Import ${preview.counts.valid} valid grants`}
            </Button>
          </div>
        </form>
      </section>
    </section>
  );
}

export function PortfolioImportPage(): React.ReactNode {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PortfolioImportPreview | null>(null);
  const [completion, setCompletion] = useState<PortfolioImportCommitResult | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const resetFileInput = (): void => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startOver = (): void => {
    setFile(null);
    setPreview(null);
    setCompletion(null);
    setAcknowledged(false);
    setError(null);
    resetFileInput();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    setFile(nextFile);
    setPreview(null);
    setCompletion(null);
    setAcknowledged(false);
    setError(null);
  };

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!file) {
      setError("Select an .xlsx workbook before analyzing.");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await analyzePortfolioImport(formData);
      if (!result.success) {
        setError(result.error);
        setPreview(null);
        return;
      }

      setPreview(result.data);
      setAcknowledged(false);
    } catch {
      setError("The workbook could not be analyzed. Try again.");
      setPreview(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!file || !preview || preview.counts.valid === 0 || !acknowledged) return;

    setError(null);
    setIsConfirming(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("acknowledged", "true");
    try {
      const result = await confirmPortfolioImport(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setCompletion(result.data);
      setFile(null);
      setPreview(null);
      setAcknowledged(false);
      resetFileInput();
    } catch {
      setError("The import could not be completed. No records were created.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      {completion ? (
        <CompletionState result={completion} onStartOver={startOver} />
      ) : (
        <>
          <header className="max-w-3xl">
            <Badge variant="secondary">Portfolio import</Badge>
            <h1 className="mt-3 text-title text-foreground">Bring your grant tracker into focus</h1>
            <p className="mt-2 text-base leading-6 text-muted-foreground">
              Upload one existing Excel tracker, review exactly what GrantFlow can use, and confirm the valid rows when you are ready. Selecting or analyzing a workbook does not change your portfolio.
            </p>
          </header>

          <section className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="import-upload-title">
            <div className="flex flex-col gap-1">
              <h2 id="import-upload-title" className="text-h2 text-foreground">1. Choose your workbook</h2>
              <p className="text-sm leading-5 text-muted-foreground">Use the fixed GrantFlow tracker columns. Only .xlsx workbooks up to 5 MiB are accepted.</p>
            </div>
            <form className="mt-6 flex flex-col gap-5" onSubmit={handleAnalyze}>
              <div>
                <label htmlFor="portfolio-import-file" className="text-label text-foreground">Excel workbook</label>
                <input
                  ref={fileInputRef}
                  id="portfolio-import-file"
                  name="file"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  disabled={isAnalyzing || isConfirming}
                  className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <p className="mt-2 text-sm text-muted-foreground" id="portfolio-import-file-help">The workbook stays in this browser interaction until you confirm or start over; it is not stored as import history.</p>
                {file && <p className="mt-2 text-sm text-foreground">Selected: <span className="font-medium">{file.name}</span> ({formatFileSize(file.size)})</p>}
              </div>
              <div>
                <Button type="submit" disabled={!file || isAnalyzing} aria-describedby="portfolio-import-file-help">
                  {isAnalyzing ? "Analyzing…" : "Analyze workbook"}
                </Button>
              </div>
            </form>
          </section>

          {error && <div className="mt-6 rounded-md border border-destructive/40 bg-destructive-soft p-4 text-sm text-destructive" role="alert">{error}</div>}

          {preview && file && (
            <PreviewReport
              preview={preview}
              file={file}
              acknowledged={acknowledged}
              isConfirming={isConfirming}
              onAcknowledgementChange={setAcknowledged}
              onConfirm={handleConfirm}
            />
          )}
        </>
      )}
    </div>
  );
}

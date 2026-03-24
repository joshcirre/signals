<?php

namespace App\Support;

class StorefrontPageOverrideSourceValidator
{
    /**
     * @return list<string>
     */
    public function validate(mixed $source): array
    {
        if (! is_array($source)) {
            return ['Arrow source must be an object containing exactly one entry file named main.ts or main.js.'];
        }

        $errors = [];
        $allowedFiles = ['main.ts', 'main.js', 'main.css'];
        $unexpectedFiles = array_values(array_diff(array_keys($source), $allowedFiles));

        if ($unexpectedFiles !== []) {
            $errors[] = 'Arrow source may only contain main.ts or main.js plus optional main.css.';
        }

        $hasMainTs = is_string($source['main.ts'] ?? null) && mb_trim((string) $source['main.ts']) !== '';
        $hasMainJs = is_string($source['main.js'] ?? null) && mb_trim((string) $source['main.js']) !== '';

        if ($hasMainTs === $hasMainJs) {
            $errors[] = 'Arrow source must include exactly one non-empty entry file: main.ts or main.js.';
        }

        if (array_key_exists('main.css', $source) && ! is_string($source['main.css'])) {
            $errors[] = 'main.css must be a string when provided.';
        }

        $entryFile = $hasMainTs ? 'main.ts' : ($hasMainJs ? 'main.js' : null);

        if ($entryFile === null) {
            return $errors;
        }

        $entrySource = mb_trim((string) $source[$entryFile]);

        if (! str_contains($entrySource, '@arrow-js/core')) {
            $errors[] = 'The entry file must import Arrow primitives from @arrow-js/core.';
        }

        if (! preg_match('/[\'"]\.\/signals\.ts[\'"]/', $entrySource)) {
            $errors[] = "The entry file must import runtime product data from './signals.ts'.";
        }

        if (! preg_match('/export\s+default\b/', $entrySource)) {
            $errors[] = 'The entry file must export a default Arrow template or component result.';
        }

        if (! preg_match('/\bhtml`/', $entrySource) && ! preg_match('/\bcomponent\s*\(/', $entrySource)) {
            $errors[] = 'The entry file must render with html`...` or component(...).';
        }

        if (preg_match('/\b(React|useState|useEffect|useMemo|useCallback|createRoot|defineComponent|createApp)\b/', $entrySource)) {
            $errors[] = 'The entry file must use Arrow primitives directly instead of React or Vue APIs.';
        }

        if (preg_match('/\bdocument\.(querySelector|getElementById|createElement)\b|\b(innerHTML|appendChild|replaceChildren)\b/', $entrySource)) {
            $errors[] = 'The entry file must not mutate the DOM directly; render through Arrow templates only.';
        }

        if (preg_match('/\bjsx\b|React\.createElement/', $entrySource)) {
            $errors[] = 'The entry file must not use JSX syntax.';
        }

        return array_values(array_unique($errors));
    }

    public function passes(mixed $source): bool
    {
        return $this->validate($source) === [];
    }

    public function failureMessage(mixed $source): string
    {
        return implode(' ', $this->validate($source));
    }
}

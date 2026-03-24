<?php

namespace App\Console\Commands\Signals;

use App\Models\Proposal;
use App\Models\StorefrontPageOverride;
use App\Support\StorefrontPageOverrideSourceValidator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('signals:validate-arrow-override
    {id : The storefront_page_override proposal ID or live override ID}
    {--live : Validate a live StorefrontPageOverride record instead of a proposal}')]
#[Description('Validate a stored Arrow storefront page override payload against the sandbox contract.')]
class ValidateArrowOverrideCommand extends Command
{
    public function handle(StorefrontPageOverrideSourceValidator $validator): int
    {
        $record = $this->option('live')
            ? StorefrontPageOverride::query()->find($this->argument('id'))
            : Proposal::query()
                ->where('type', 'storefront_page_override')
                ->find($this->argument('id'));

        if ($record === null) {
            $this->error('Could not find the requested Arrow override record.');

            return self::FAILURE;
        }

        $source = $this->option('live')
            ? $record->arrow_source_json
            : ($record->payload_json['arrow_source'] ?? null);
        $errors = $validator->validate($source);

        $this->components->info($this->option('live')
            ? sprintf('Live storefront override #%d', $record->id)
            : sprintf('Storefront page override proposal #%d', $record->id));
        $this->line('Title: '.($this->option('live')
            ? ($record->title ?: 'Untitled override')
            : (string) ($record->payload_json['title'] ?? 'Untitled override')));
        $this->line('Entry files: '.implode(', ', array_keys(is_array($source) ? $source : [])));

        if ($errors === []) {
            $this->components->info('Arrow payload is valid.');

            return self::SUCCESS;
        }

        foreach ($errors as $error) {
            $this->components->error($error);
        }

        return self::FAILURE;
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:4000'],
            'rationale' => ['required', 'string', 'max:2000'],
            'confidence' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'content.required' => 'Proposal content is required before saving changes.',
            'rationale.required' => 'Proposal rationale is required before saving changes.',
            'confidence.min' => 'Confidence must be between 0 and 1.',
            'confidence.max' => 'Confidence must be between 0 and 1.',
        ];
    }
}

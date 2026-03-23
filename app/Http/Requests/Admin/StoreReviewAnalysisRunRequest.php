<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReviewAnalysisRunRequest extends FormRequest
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
            'kind' => ['nullable', 'string', Rule::in(['review_analysis', 'storefront_adaptation'])],
            'focus' => ['nullable', 'string', 'max:180'],
            'proposal_id' => [
                Rule::requiredIf($this->string('kind')->toString() === 'storefront_adaptation'),
                'nullable',
                'integer',
                'exists:proposals,id',
            ],
            'redirect_to' => ['nullable', 'string', Rule::in(['run', 'signals'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'proposal_id.required' => 'Choose a product copy proposal before starting a storefront adaptation run.',
        ];
    }
}

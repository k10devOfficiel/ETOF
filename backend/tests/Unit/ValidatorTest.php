<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Validator;
use PHPUnit\Framework\TestCase;

final class ValidatorTest extends TestCase
{
    private Validator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new Validator();
    }

    public function testRequiredRule(): void
    {
        $rules = ['name' => 'required'];

        $this->assertFalse($this->validator->validate([], $rules));
        $this->assertArrayHasKey('name', $this->validator->getErrors());

        $this->assertFalse($this->validator->validate(['name' => ''], $rules));
        $this->assertFalse($this->validator->validate(['name' => null], $rules));

        $this->assertTrue($this->validator->validate(['name' => 'Jean Kouame'], $rules));
    }

    public function testEmailRule(): void
    {
        $rules = ['email' => 'required|email'];

        $this->assertTrue($this->validator->validate(['email' => 'contact@etofsarl.com'], $rules));
        $this->assertTrue($this->validator->validate(['email' => 'jean.kouame@cie.ci'], $rules));

        $this->assertFalse($this->validator->validate(['email' => 'not-an-email'], $rules));
        $this->assertFalse($this->validator->validate(['email' => 'test@'], $rules));
        $this->assertFalse($this->validator->validate(['email' => '@domain.com'], $rules));
    }

    public function testPhoneRuleIvorianAndInternational(): void
    {
        $rules = ['phone' => 'required|phone'];

        // Numéros ivoiriens indicatif +225 (10 chiffres)
        $this->assertTrue($this->validator->validate(['phone' => '+225 07 01 02 03 04'], $rules));
        $this->assertTrue($this->validator->validate(['phone' => '+2250102030405'], $rules));
        $this->assertTrue($this->validator->validate(['phone' => '00225 05 11 22 33 44'], $rules));

        // Format local ivoirien (10 chiffres commençant par 01, 05, 07, 21, 25, 27)
        $this->assertTrue($this->validator->validate(['phone' => '0701020304'], $rules));
        $this->assertTrue($this->validator->validate(['phone' => '05 12 34 56 78'], $rules));
        $this->assertTrue($this->validator->validate(['phone' => '27 22 44 55 66'], $rules));

        // Format international générique
        $this->assertTrue($this->validator->validate(['phone' => '+33 6 12 34 56 78'], $rules));
        $this->assertTrue($this->validator->validate(['phone' => '+14155552671'], $rules));

        // Formats invalides
        $this->assertFalse($this->validator->validate(['phone' => '12345'], $rules));
        $this->assertFalse($this->validator->validate(['phone' => 'abcde12345'], $rules));
    }

    public function testMinAndMaxRules(): void
    {
        // Chaîne
        $stringRules = ['slug' => 'min:3|max:10'];
        $this->assertTrue($this->validator->validate(['slug' => 'berline'], $stringRules));
        $this->assertFalse($this->validator->validate(['slug' => 'ab'], $stringRules));
        $this->assertFalse($this->validator->validate(['slug' => 'trop-long-de-plus-de-10'], $stringRules));

        // Nombre
        $numRules = ['price' => 'integer|min:100|max:100000'];
        $this->assertTrue($this->validator->validate(['price' => 5000], $numRules));
        $this->assertFalse($this->validator->validate(['price' => 50], $numRules));
        $this->assertFalse($this->validator->validate(['price' => 200000], $numRules));

        // Tableau
        $arrayRules = ['items' => 'required|min:1|max:3'];
        $this->assertTrue($this->validator->validate(['items' => [1, 2]], $arrayRules));
        $this->assertFalse($this->validator->validate(['items' => []], $arrayRules));
        $this->assertFalse($this->validator->validate(['items' => [1, 2, 3, 4]], $arrayRules));
    }

    public function testInRule(): void
    {
        $rules = ['activity' => 'required|in:farm,vehicle,office,fuel,general'];

        $this->assertTrue($this->validator->validate(['activity' => 'farm'], $rules));
        $this->assertTrue($this->validator->validate(['activity' => 'vehicle'], $rules));
        $this->assertTrue($this->validator->validate(['activity' => 'fuel'], $rules));

        $this->assertFalse($this->validator->validate(['activity' => 'aviation'], $rules));
        $this->assertFalse($this->validator->validate(['activity' => 'crypto'], $rules));
    }

    public function testDateRule(): void
    {
        $rules = ['date' => 'required|date'];

        $this->assertTrue($this->validator->validate(['date' => '2026-12-01'], $rules));
        $this->assertTrue($this->validator->validate(['date' => '2024-02-29'], $rules)); // Année bissextile valide

        $this->assertFalse($this->validator->validate(['date' => '2023-02-29'], $rules)); // 29 février 2023 inexistant
        $this->assertFalse($this->validator->validate(['date' => '01/12/2026'], $rules));
        $this->assertFalse($this->validator->validate(['date' => 'invalid-date'], $rules));
    }

    public function testIntegerAndBooleanRules(): void
    {
        $rules = [
            'count' => 'required|integer',
            'consent' => 'required|boolean',
        ];

        $this->assertTrue($this->validator->validate(['count' => 10, 'consent' => true], $rules));
        $this->assertTrue($this->validator->validate(['count' => '42', 'consent' => '1'], $rules));
        $this->assertTrue($this->validator->validate(['count' => 0, 'consent' => false], $rules));

        $this->assertFalse($this->validator->validate(['count' => '3.14', 'consent' => true], $rules));
        $this->assertFalse($this->validator->validate(['count' => 10, 'consent' => 'maybe'], $rules));
    }

    public function testEmptyOptionalFieldsDoNotTriggerRules(): void
    {
        $rules = [
            'company' => 'max:150',
            'date' => 'date',
            'phone' => 'phone',
        ];

        $this->assertTrue($this->validator->validate([
            'company' => '',
            'date' => null,
            'phone' => '',
        ], $rules));
    }
}

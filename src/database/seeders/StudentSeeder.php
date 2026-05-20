<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
       Student::firstOrCreate([
            'nim' => '20230801509',
            'name' => 'Terserah Apa Aja DeH',
        ]);
    }
}

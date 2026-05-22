export const HIRE_DETAILS = {
  legalEmployer: 'Flyktninghjelpen (Norwegian Refugee Council)',
  wayToHire: 'Hire',
  reasonToHire: 'Hire to fill vacant position',
  businessUnit: 'Norway',
  position: 'Donor Service Assistant Norway',
  firstName: 'Magma',
  lastName: 'Lava',
} as const;

export function getTestDate(): string {
  const date = process.env.TESTDATE;
  if (!date) throw new Error('TESTDATE environment variable is not set');
  return date;
}
interface UserMediaErrorMessage {
  name: string;
  message: string;
}

export const errorMessages: UserMediaErrorMessage[] = [
  {
    name: 'NotFoundError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'DevicesNotFoundError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'NotReadableError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'TrackStartError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'OverconstrainedError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'ConstraintNotSatisfiedError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'NotAllowedError',
    message: 'Looks like we cant access your webcam',
  },
  {
    name: 'PermissionDeniedError',
    message: 'Looks like we cant access your webcam',
  },
];

export function getFriendlyErrorMessage(err: Error): string {
  const errorMessage = errorMessages.find((error) => error.name === err.name);
  if (errorMessage) return errorMessage.message;
  return 'Oops - something went wrong!';
}

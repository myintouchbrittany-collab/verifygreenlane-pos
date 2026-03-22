function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function removeUndefinedFields(value) {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => removeUndefinedFields(entry))
      .filter((entry) => entry !== undefined);
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce((result, [key, entry]) => {
      const cleanedEntry = removeUndefinedFields(entry);

      if (cleanedEntry !== undefined) {
        result[key] = cleanedEntry;
      }

      return result;
    }, {});
  }

  return value;
}

export function withDefaultVerificationStatus(record, fallback = "pending") {
  if (!record || typeof record !== "object") {
    return record;
  }

  if (
    record.verificationStatus !== undefined ||
    record.idVerificationStatus !== undefined
  ) {
    return record;
  }

  return {
    ...record,
    verificationStatus: fallback,
    idVerificationStatus: fallback,
  };
}

export function prepareFirestorePayload(record, options = {}) {
  const { defaultVerificationStatus } = options;
  const payload =
    defaultVerificationStatus !== undefined
      ? withDefaultVerificationStatus(record, defaultVerificationStatus)
      : record;

  return removeUndefinedFields(payload);
}

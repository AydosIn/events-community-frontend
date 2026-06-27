const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;
const TELEGRAM_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistrationForm(form) {
  const errors = {};
  const firstName = String(form.first_name || "").trim();
  const lastName = String(form.last_name || "").trim();
  const phone = String(form.phone_number || "").trim();
  const telegram = String(form.telegram_username || "").trim().replace(/^@+/, "");
  const age = Number(form.age);

  if (!firstName || firstName.length < 2) {
    errors.first_name = "First name must be at least 2 characters.";
  }

  if (!lastName || lastName.length < 2) {
    errors.last_name = "Last name must be at least 2 characters.";
  }

  if (!Number.isInteger(age) || age < 13 || age > 100) {
    errors.age = "Age must be between 13 and 100.";
  }

  if (!PHONE_PATTERN.test(phone)) {
    errors.phone_number = "Enter a valid phone number.";
  }

  if (!TELEGRAM_PATTERN.test(telegram)) {
    errors.telegram_username = "Telegram username must be 5-32 characters (letters, numbers, underscore).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      first_name: firstName,
      last_name: lastName,
      age,
      phone_number: phone,
      telegram_username: telegram,
    },
  };
}

export function validateSignupForm(form) {
  const errors = {};
  const fullName = String(form.full_name || "").trim();
  const email = String(form.email || "").trim().toLowerCase();
  const password = String(form.password || "");

  if (!fullName || fullName.length < 2) {
    errors.full_name = "Full name must be at least 2 characters.";
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { full_name: fullName, email, password },
  };
}

export function validateOpportunityForm(form) {
  const errors = {};
  const title = String(form.title || "").trim();
  const description = String(form.description || "").trim();
  const region = String(form.region_name || "").trim();
  const type = String(form.type || "").trim().toLowerCase();

  if (!title || title.length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }

  if (!description || description.length < 10) {
    errors.description = "Description must be at least 10 characters.";
  }

  if (!["club", "project", "workshop"].includes(type)) {
    errors.type = "Type must be club, project, or workshop.";
  }

  if (!region || region.length < 2) {
    errors.region_name = "Region must be at least 2 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { title, description, type, region_name: region },
  };
}

export function getFirstError(errors) {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : "";
}

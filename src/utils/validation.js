// src/utils/validation.js

/**
 * Returns the current date as a string in 'YYYY-MM-DD' format.
 * @returns {string} Today's date.
 */
export const getToday = () => new Date().toISOString().split("T")[0];

/**
 * Returns the maximum allowed date (60 days from now) as a string in 'YYYY-MM-DD' format.
 * @returns {string} The maximum date.
 */
export const getMaxDate = () => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  return maxDate.toISOString().split("T")[0];
};

/**
 * Validates the job form data.
 * @param {object} formData - The form data to validate.
 * @param {string} formData.title - The job title.
 * @param {string} formData.date - The job date.
 * @param {string} formData.time - The job time.
 * @param {string|number} [formData.budget] - The job budget (optional).
 * @returns {{isValid: boolean, message: string}} - Validation result.
 */
export const validateJobForm = (formData) => {
  const { title, date, time, budget } = formData;
  const todayStr = getToday();
  const maxStr = getMaxDate();

  if (!title || !title.trim()) {
    return { isValid: false, message: "❌ Job title is required." };
  }
  if (!date) {
    return { isValid: false, message: "❌ Job date is required." };
  }
  if (!time) {
    return { isValid: false, message: "❌ Job time is required." };
  }
  if (date < todayStr) {
    return { isValid: false, message: "❌ Job date cannot be in the past." };
  }
  if (date > maxStr) {
    return { isValid: false, message: "❌ Job date cannot be more than 60 days from now." };
  }

  if (budget) {
    const numericBudget = parseFloat(budget);
    if (isNaN(numericBudget)) {
      return { isValid: false, message: "❌ Budget must be a valid number." };
    }
    if (numericBudget < 0) {
      return { isValid: false, message: "❌ Budget cannot be negative." };
    }
    if (numericBudget > 999) {
      return { isValid: false, message: "❌ Budget cannot exceed £999." };
    }
  }

  return { isValid: true, message: "" };
};
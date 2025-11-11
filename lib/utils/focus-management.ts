/**
 * Focuses the first invalid input in a form
 * @param formElement - The form element to search within
 */
export function focusFirstInvalidInput(formElement: HTMLFormElement) {
  const firstInvalid = formElement.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    '[aria-invalid="true"], :invalid'
  );
  
  if (firstInvalid) {
    firstInvalid.focus();
    // Scroll into view if needed
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Connects an error message to an input via aria-describedby
 * @param inputId - The ID of the input element
 * @param errorId - The ID of the error message element
 */
export function connectErrorToInput(inputId: string, errorId: string) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  
  if (input && error) {
    input.setAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby');
    
    if (describedBy) {
      if (!describedBy.includes(errorId)) {
        input.setAttribute('aria-describedby', `${describedBy} ${errorId}`);
      }
    } else {
      input.setAttribute('aria-describedby', errorId);
    }
  }
}

/**
 * Removes error connection from an input
 * @param inputId - The ID of the input element
 * @param errorId - The ID of the error message element
 */
export function disconnectErrorFromInput(inputId: string, errorId: string) {
  const input = document.getElementById(inputId);
  
  if (input) {
    input.setAttribute('aria-invalid', 'false');
    const describedBy = input.getAttribute('aria-describedby');
    
    if (describedBy) {
      const newDescribedBy = describedBy
        .split(' ')
        .filter(id => id !== errorId)
        .join(' ');
        
      if (newDescribedBy) {
        input.setAttribute('aria-describedby', newDescribedBy);
      } else {
        input.removeAttribute('aria-describedby');
      }
    }
  }
}

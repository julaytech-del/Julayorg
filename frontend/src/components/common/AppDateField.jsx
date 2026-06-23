import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parse, format as formatDate, isValid } from 'date-fns';

// App-controlled date field. Replaces the native <input type="date"> whose displayed
// format/language was decided by the *browser* locale (it showed Arabic even when the
// app language was English). This always renders dd/MM/yyyy regardless of browser.
//
// Drop-in for the previous MUI <TextField type="date">: `value` is a 'yyyy-MM-dd'
// string and `onChange` fires an event-like { target: { name, value } } so existing
// handlers (e.target.value) keep working unchanged. Any extra props (size, fullWidth,
// sx, variant, InputProps, inputProps, ...) are forwarded to the underlying TextField.
export default function AppDateField({
  value,
  onChange,
  name,
  label,
  readOnly,
  disabled,
  InputLabelProps,
  ...textFieldProps
}) {
  let parsed = null;
  if (value) {
    const d = parse(value, 'yyyy-MM-dd', new Date());
    if (isValid(d)) parsed = d;
  }

  return (
    <DatePicker
      label={label}
      value={parsed}
      format="dd/MM/yyyy"
      readOnly={readOnly}
      disabled={disabled}
      onChange={(nv) => {
        const str = nv && isValid(nv) ? formatDate(nv, 'yyyy-MM-dd') : '';
        onChange && onChange({ target: { name: name || '', value: str } });
      }}
      slotProps={{
        textField: {
          name,
          InputLabelProps: { shrink: true, ...(InputLabelProps || {}) },
          ...textFieldProps,
        },
      }}
    />
  );
}

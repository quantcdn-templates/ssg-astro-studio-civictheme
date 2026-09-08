import { describe } from 'vitest';
import Field from '@civictheme/molecules/Field.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'field' };

const keys = {
  emptyTitle: 'Field Component Field Component - empty title with textfield renders 0 title(s) 1',
  hiddenTitleHidden: 'Field Component Field Component - hidden title with hidden input renders 0 title(s) 1',
  hiddenTitleTextfield: 'Field Component Field Component - hidden title with textfield renders 0 title(s) 1',
  invisibleTitle: 'Field Component Field Component - invisible title with textfield renders 1 title(s) 1',
  visibleTitleHidden: 'Field Component Field Component - visible title with hidden input renders 0 title(s) 1',
  visibleTitleTextfield: 'Field Component Field Component - visible title with textfield renders 1 title(s) 1',
  defaultInput: 'Field Component default input 1',
  defaultValues: 'Field Component default values 1',
  customMessage: 'Field Component field messages custom message renders correctly when message object is passed 1',
  defaultMessageInvalid: 'Field Component field messages default message renders when field is invalid without message object and no field title 1',
  defaultMessageTitle: 'Field Component field messages default message renders when message object has no content and title is present 1',
  multiControlCheckbox: 'Field Component multiple control as array propagation - checkbox 1',
  multiControlTextfield: 'Field Component multiple control as array propagation - textfield 1',
  multiControlMixedCheckbox: 'Field Component multiple control as array propagation with mixed levels - checkbox 1',
  noName: 'Field Component nothing is rendered if name is not provided 1',
  radio: 'Field Component radio 1',
  requiredDisabledDescription: 'Field Component required, disabled, and description 1',
  select: 'Field Component select 1',
  singleControlArray: 'Field Component single control as array propagation 1',
  singleControlObject: 'Field Component single control as object propagation 1',
  textareaAll: 'Field Component textarea with all attributes 1',
  textfield: 'Field Component textfield 1',
  themeOrientationInvalid: 'Field Component theme, orientation, and invalid state 1',
  values: 'Field Component values 1',
};

describe('Field', () => {
  parityCase(meta, keys.noName, Field, { other: 'test' });

  parityCase(meta, keys.defaultValues, Field, { name: 'test' });

  parityCase(meta, keys.values, Field, { name: 'testname', value: 'testvalue' });

  parityCase(meta, keys.themeOrientationInvalid, Field, {
    name: 'testname',
    type: 'textfield',
    theme: 'dark',
    isInvalid: true,
    orientation: 'horizontal',
  });

  parityCase(meta, keys.requiredDisabledDescription, Field, {
    name: 'testname',
    type: 'textfield',
    isRequired: true,
    isDisabled: true,
    description: 'This is a description',
  });

  parityCase(meta, keys.textfield, Field, {
    type: 'textfield',
    title: 'Test Title',
    name: 'testname',
    value: 'testvalue',
    id: 'testid',
    class: 'custom-modifier',
    'data-test': 'true',
  });

  parityCase(meta, keys.singleControlObject, Field, {
    type: 'textfield',
    title: 'Test Title',
    control: {
      name: 'testname',
      value: 'testvalue',
      id: 'testid',
      class: 'custom-modifier',
      'data-test': 'true',
    },
  });

  parityCase(meta, keys.singleControlArray, Field, {
    type: 'textfield',
    title: 'Test Title',
    control: [
      {
        name: 'testname',
        value: 'testvalue',
        id: 'testid',
        class: 'custom-modifier',
        'data-test': 'true',
      },
    ],
  });

  parityCase(meta, keys.multiControlTextfield, Field, {
    type: 'textfield',
    title: 'Test Title',
    control: [
      { name: 'testname', value: 'testvalue', id: 'testid', class: 'custom-modifier', 'data-test': 'true' },
      { name: 'testname2', value: 'testvalue2', id: 'testid2', class: 'custom-modifier2', 'data-test': 'false' },
    ],
  });

  parityCase(meta, keys.multiControlCheckbox, Field, {
    type: 'checkbox',
    title: 'Test Title',
    control: [
      { name: 'testname', value: 'testvalue', id: 'testid', class: 'custom-modifier', 'data-test': 'true' },
      {
        name: 'testname',
        value: 'testvalue2',
        id: 'testid2',
        isChecked: true,
        class: 'custom-modifier2',
        'data-test': 'false',
      },
    ],
  });

  parityCase(meta, keys.multiControlMixedCheckbox, Field, {
    type: 'checkbox',
    title: 'Test Title',
    name: 'testname',
    id: 'testid',
    class: 'custom-modifier-parent',
    'data-test-parent': 'true',
    control: [
      {
        label: 'Checkbox 1',
        value: 'testvalue',
        id: 'testid1',
        class: 'custom-modifier-nested1',
        'data-test-nested1': 'true',
      },
      {
        label: 'Checkbox 2',
        value: 'testvalue2',
        id: 'testid2',
      },
    ],
  });

  parityCase(meta, keys.textareaAll, Field, {
    type: 'textarea',
    title: 'Test Title',
    name: 'testname',
    value: 'testvalue',
    id: 'testid',
    isRequired: true,
    isInvalid: true,
    'data-test': 'true',
    class: 'custom-modifier',
  });

  parityCase(meta, keys.select, Field, {
    type: 'select',
    title: 'Test Title',
    name: 'testname',
    value: 'testvalue',
    id: 'testid',
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
    ],
    class: 'custom-modifier',
    'data-test': 'true',
  });

  parityCase(meta, keys.radio, Field, {
    type: 'radio',
    title: 'Test Title',
    control: [
      { name: 'testname', value: 'testvalue', id: 'testid', isChecked: false, class: 'custom-modifier', 'data-test': 'true' },
      {
        name: 'testname',
        value: 'testvalue2',
        id: 'testid2',
        isChecked: true,
        class: 'custom-modifier2',
        'data-test': 'false',
      },
    ],
  });

  parityCase(meta, keys.defaultInput, Field, {
    type: 'email',
    title: 'Test Title',
    name: 'testname',
    value: 'testvalue',
    id: 'testid',
    class: 'custom-modifier',
    'data-test': 'true',
  });

  parityCase(meta, keys.customMessage, Field, {
    name: 'testname',
    type: 'textfield',
    message: { content: 'Custom error message', 'data-test': 'true' },
  });

  parityCase(meta, keys.defaultMessageInvalid, Field, {
    name: 'testname',
    type: 'textfield',
    isInvalid: true,
  });

  parityCase(meta, keys.defaultMessageTitle, Field, {
    name: 'testname',
    title: 'Test input',
    type: 'textfield',
    isInvalid: true,
    message: { 'data-test': 'true' },
  });

  parityCase(meta, keys.visibleTitleTextfield, Field, {
    title: 'Test Title',
    titleDisplay: 'visible',
    type: 'textfield',
    name: 'testname',
  });

  parityCase(meta, keys.invisibleTitle, Field, {
    title: 'Test Title',
    titleDisplay: 'invisible',
    type: 'textfield',
    name: 'testname',
  });

  parityCase(meta, keys.hiddenTitleTextfield, Field, {
    title: 'Test Title',
    titleDisplay: 'hidden',
    type: 'textfield',
    name: 'testname',
  });

  parityCase(meta, keys.emptyTitle, Field, {
    title: '',
    titleDisplay: 'visible',
    type: 'textfield',
    name: 'testname',
  });

  parityCase(meta, keys.visibleTitleHidden, Field, {
    title: 'Test Title',
    titleDisplay: 'visible',
    type: 'hidden',
    name: 'testname',
  });

  parityCase(meta, keys.hiddenTitleHidden, Field, {
    title: 'Test Title',
    titleDisplay: 'hidden',
    type: 'hidden',
    name: 'testname',
  });

  expectAllKeysCovered(meta, Object.values(keys));
});

/**
 * Choices shared by many sections: the small picture beside a point and the
 * colour of its card. The website maps these keys to drawings and colours in
 * src/components/site/icons.tsx.
 */
import type { ScalarField } from '../types';

export const ICON_OPTIONS = [
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'smile', label: 'Smiling face' },
  { value: 'users', label: 'Group of people' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'blocks', label: 'Building blocks' },
  { value: 'book', label: 'Book' },
  { value: 'palette', label: 'Paint palette' },
  { value: 'music', label: 'Music' },
  { value: 'puzzle', label: 'Puzzle piece' },
  { value: 'shield', label: 'Shield (safety)' },
  { value: 'home', label: 'Home' },
  { value: 'sun', label: 'Sun' },
  { value: 'play', label: 'Play area' },
  { value: 'water', label: 'Water drop' },
  { value: 'hand', label: 'Helping hand' },
  { value: 'chat', label: 'Speech bubble' },
  { value: 'map', label: 'Map pin' },
  { value: 'rupee', label: 'Rupee' },
  { value: 'ruler', label: 'Ruler (space)' },
  { value: 'key', label: 'Key' },
  { value: 'clock', label: 'Clock' },
  { value: 'library', label: 'Library' },
  { value: 'computer', label: 'Computer' },
  { value: 'meal', label: 'Meal' },
  { value: 'flask', label: 'Science flask' },
  { value: 'trophy', label: 'Trophy' },
  { value: 'flag', label: 'Flag' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'school', label: 'School building' },
  { value: 'pen', label: 'Pen' },
  { value: 'globe', label: 'Globe' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'drama', label: 'Drama masks' },
  { value: 'bolt', label: 'Electricity' },
];

export const COLOUR_OPTIONS = [
  { value: 'sun', label: 'Yellow' },
  { value: 'coral', label: 'Orange' },
  { value: 'mint', label: 'Green' },
  { value: 'sky', label: 'Blue' },
  { value: 'brand', label: 'Brand colour' },
];

export const iconField: ScalarField = {
  name: 'icon',
  label: 'Small picture',
  type: 'select',
  options: ICON_OPTIONS,
  aliases: ['icon', 'symbol'],
};

export const colourField: ScalarField = {
  name: 'color',
  label: 'Colour',
  type: 'select',
  options: COLOUR_OPTIONS,
  aliases: ['colour', 'color', 'shade'],
};

/** The three fields at the top of every inner page. */
export const pageTopFields: ScalarField[] = [
  { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40, aliases: ['label', 'small heading'] },
  { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title', 'headline', 'page title'] },
  { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 320, aliases: ['description', 'intro', 'subheading'] },
];

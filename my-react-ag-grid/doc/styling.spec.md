# Styling Specification for React Features

This document outlines the styling standards for feature development in the my-react-ag-grid project, based on the comprehensive styling approach of the Config-Operation feature. These guidelines aim to maintain consistency across different components and features.

## 1. General Layout and Structure

- **Container Styling**: Use a padded container with a light background (e.g., `bg-gray-50`) and set a minimum height to cover the viewport (`min-h-screen`) for main feature pages.
- **Content Width**: Center content with a maximum width (e.g., `max-w-7xl`) to ensure readability on larger screens.
- **Padding and Margins**: Apply consistent padding (e.g., `p-6`) and margins (e.g., `mb-6`) to create spacing between elements.

## 2. Card Components

- **Card Usage**: Utilize Card components (e.g., Ant Design's `Card`) for grouping related content, such as forms and data grids.
- **Card Styling**: Add subtle shadows (e.g., `shadow-sm`) for elevation and apply custom class names (e.g., `config-card`) for potential additional styling.
- **Card Titles**: Include actionable elements in card titles, aligning them with the content title for a cohesive look, using flexbox for layout (e.g., `flex items-center justify-between`).

## 3. Form Styling

- **Form Layout**: Use inline layout for forms (e.g., `layout="inline"`) with flexbox to align items (e.g., `flex items-center gap-4`).
- **Input Fields**: Ensure input fields have full width within their containers (e.g., `w-full`) and apply consistent spacing with flex growth for responsive design (e.g., `flex-1`).

## 4. Button Styling

- **Button Variants**: Use color-coded buttons to indicate action types, with distinct border and text colors for visibility:
  - Primary actions (e.g., Save, Search): Use primary color scheme (e.g., `border-primary-500 bg-primary-500`).
  - Edit actions: Use a distinct color like green or primary variant (e.g., `border-primary-500 text-primary-500`).
  - Delete actions: Use red for caution (e.g., `border-red-500 text-red-500`).
  - Import/Export: Use blue and orange respectively for differentiation (e.g., `border-blue-500 text-blue-500`, `border-orange-500 text-orange-500`).
  - Discard/Secondary: Use gray for less emphasis (e.g., `border-gray-500 text-gray-500`).
- **Hover Effects**: Include hover states for interactive feedback (e.g., `hover:bg-primary-50`, `hover:bg-primary-600`).
- **Disabled States**: Clearly indicate disabled buttons with faded colors (e.g., `disabled:border-gray-300 disabled:text-gray-400`).
- **Icons**: Pair buttons with appropriate icons from Ant Design (e.g., `EditOutlined`, `DeleteOutlined`) for visual cues.
- **Spacing**: Group related buttons with consistent spacing using Space component (e.g., `<Space>`).

## 5. Data Grid Styling (AG Grid)

- **Theme**: Use a predefined theme like `ag-theme-alpine` for a clean, professional look.
- **Height and Width**: Set explicit dimensions for the grid container (e.g., `h-96 w-full`) to ensure proper rendering within the layout.
- **Row Styling**: Implement dynamic row styling based on data state using row class rules:
  - Deleted rows: Highlight with a specific class (e.g., `row-deleted`).
  - New rows: Indicate with a distinct class (e.g., `row-new`).
  - Modified rows: Differentiate with another class (e.g., `row-modified`).
- **Loading and Empty States**: Customize overlay templates for loading (e.g., `overlayLoadingTemplate`) and no-data states (e.g., `overlayNoRowsTemplate`) with centered, styled messages.
- **Custom CSS**: Include custom CSS files (e.g., `ag-grid-custom.css`) for additional grid-specific styling overrides.

## 6. Typography

- **Titles**: Use hierarchical typography levels (e.g., `Title level={2}`) with bottom margins for separation (e.g., `mb-6`).

## 7. Responsive Design

- **Flexibility**: Ensure components adapt to different screen sizes using flexible layouts (e.g., `flex-1`, `max-w-md` for form items).

## 8. Visual Feedback

- **State-Based Styling**: Provide visual cues for user actions through color changes and styling based on application state (e.g., row class rules for grid data).
- **Loading Indicators**: Show loading states on buttons and grids during data operations (e.g., `loading={isLoading}`).

## 9. Custom Classes

- **Reusable Classes**: Define custom classes for specific components or states (e.g., `config-card`) to allow for project-wide styling consistency and easy updates.

## Conclusion

Adhering to these styling standards will ensure a consistent user experience across features in the my-react-ag-grid project. Developers should reference the Config-Operation feature as a practical example of these guidelines in action, particularly for grid-based data management interfaces.

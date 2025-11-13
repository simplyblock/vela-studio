import createSupabaseIcon from '../createSupabaseIcon'

/**
 * @component @name User
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOyBib3JkZXItcmFkaXVzOiAycHgiICAgIHN0cm9rZS13aWR0aD0iMSI+CiAgICA8cGF0aAogICAgICAgIGQ9Ik03LjA2NDczIDE5LjYzMjhDNC42MTY0OCAxOC4wMjQ0IDMgMTUuMjUzNyAzIDEyLjEwNTVDMyA3LjEzNDkxIDcuMDI5NDQgMy4xMDU0NyAxMiAzLjEwNTQ3QzE2Ljk3MDYgMy4xMDU0NyAyMSA3LjEzNDkxIDIxIDEyLjEwNTVDMjEgMTUuMjUzNyAxOS40MjczIDE4LjAwOTQgMTYuOTc5IDE5LjYxNzhNMTYuOTc5OSAyMi4yODQ0VjE5LjcxMzZDMTYuOTc5OSAxNy4wMjU4IDE0LjgwMTEgMTQuODQ2OSAxMi4xMTMzIDE0Ljg0NjlDOS40MjU0NyAxNC44NDY5IDcuMjQ2NTggMTcuMDI1OCA3LjI0NjU4IDE5LjcxMzZWMjIuMjg0NE0xNSAxMS44NDY5QzE1IDEzLjUwMzggMTMuNjU2OSAxNC44NDY5IDEyIDE0Ljg0NjlDMTAuMzQzMSAxNC44NDY5IDkgMTMuNTAzOCA5IDExLjg0NjlDOSAxMC4xOTAxIDEwLjM0MzEgOC44NDY5MiAxMiA4Ljg0NjkyQzEzLjY1NjkgOC44NDY5MiAxNSAxMC4xOTAxIDE1IDExLjg0NjlaIiAvPgo8L3N2Zz4=)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const User = createSupabaseIcon('User', [
  [
    'path',
    {
      d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      key: '173y10',
    },
  ],
  [
    'circle',
    {
      cx: "12",
      cy: "7",
      r: "4",
      key: '123456',
    }
  ]
]);

export default User;

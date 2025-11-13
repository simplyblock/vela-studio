import styles from './loading-anim.module.css'

const LogoLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div>
      <svg
        width="60"
        height="62"
        viewBox="0 0 60 62"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles['loading']}
      >
        <path
          d="M5 5 L30 57 L55 5"
          stroke="hsl(var(--brand-default))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
)

export default LogoLoader

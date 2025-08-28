import styles from "./page.module.css";

export const metadata = {
  title: "PDFTOEXCEL",
};

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>PDFからExcelへのデータ変換ソフト</h1>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}

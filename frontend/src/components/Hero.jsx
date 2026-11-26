export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow">HANDMADE WITH LOVE</span>
        <h1>把喜歡的模樣，<br /><em>串成日常的小美好。</em></h1>
        <p>手作手機鍊、療癒萌粒與 DIY 材料，陪你打造獨一無二的可愛日常。</p>
        <a className="primary-link" href="#products">探索手作選物 <span>→</span></a>
      </div>
      <div className="hero-art" aria-label="手作珠串裝飾" role="img">
        <span className="art-orbit orbit-one" />
        <span className="art-orbit orbit-two" />
        <span className="art-pearl pearl-one" />
        <span className="art-pearl pearl-two" />
        <span className="art-ribbon">♡</span>
        <span className="art-caption">made with<br />a little love</span>
      </div>
    </section>
  );
}

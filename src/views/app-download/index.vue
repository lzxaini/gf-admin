<template>
  <main class="download-page">
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>

    <header class="page-header">
      <div class="brand">
        <img class="brand-logo" :src="logo" alt="" />
        <span>禾壹净</span>
      </div>
      <span class="header-label">让健康管理，更轻松一点</span>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="eyebrow-dot"></span> 禾壹净移动应用</div>
        <h1>健康生活，<br /><em>从这里开始。</em></h1>
        <p class="intro">打开禾壹净 APP，随时随地开启更便捷的健康体验。把关心放在手边，让每一天都自在从容。</p>

        <div class="download-action">
          <a v-if="downloadUrl" class="download-button" :href="downloadUrl" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            下载 APP
            <span class="button-arrow">↗</span>
          </a>
          <span v-else class="download-button disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            下载地址待配置
          </span>
          <p class="download-hint">{{ downloadUrl ? '点击按钮，获取最新版本' : '配置下载链接后即可开放下载' }}</p>
        </div>

        <div class="feature-list">
          <span><i>01</i> 便捷使用</span>
          <span><i>02</i> 清晰记录</span>
          <span><i>03</i> 随时陪伴</span>
        </div>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="visual-ring ring-back"></div>
        <div class="visual-ring ring-front"></div>
        <div class="float-card float-top"><span class="float-icon">✦</span><span>自在生活<br /><small>从每一天开始</small></span></div>
        <div class="phone">
          <span class="phone-button button-action"></span>
          <span class="phone-button button-volume-up"></span>
          <span class="phone-button button-volume-down"></span>
          <span class="phone-button button-power"></span>
          <div class="phone-screen">
            <div class="dynamic-island"><span></span></div>
            <img class="splash-logo" :src="logoText" alt="" />
            <div class="home-indicator"></div>
          </div>
        </div>
        <div class="float-card float-bottom"><span class="check-icon">✓</span><span>健康好习惯<small>就从现在开始</small></span></div>
      </div>
    </section>

    <footer class="page-footer"><span>© {{ new Date().getFullYear() }} 禾壹净</span><span>美好生活，自在同行</span></footer>
  </main>
</template>

<script setup>
import logo from '@/assets/logo/logo.png'
import logoText from '@/assets/logo/logo-text.png'
// 将下方地址替换为实际的 APP 下载链接；留空时按钮不会跳转。
const downloadUrl = 'https://cdn.hyj001.top/App/distribution.apk'
</script>

<style scoped>
.download-page{--ink:#163c39;--green:#16866d;min-height:100vh;overflow:hidden;position:relative;isolation:isolate;box-sizing:border-box;padding:0 max(32px,calc((100vw - 1240px)/2));color:var(--ink);background:#f7faf6;font-family:"PingFang SC","Microsoft YaHei",sans-serif}
.download-page *{box-sizing:border-box}.ambient{position:absolute;border-radius:50%;pointer-events:none;z-index:-1}.ambient-one{width:700px;height:700px;right:-180px;top:-300px;background:radial-gradient(circle,#d6eee2 0%,rgba(214,238,226,0) 70%)}.ambient-two{width:500px;height:500px;left:-290px;bottom:-290px;background:radial-gradient(circle,#e3efdb 0%,rgba(227,239,219,0) 70%)}
.page-header,.page-footer{display:flex;align-items:center;justify-content:space-between}.page-header{height:106px}.brand{display:flex;align-items:center;gap:12px;font-size:23px;font-weight:800;letter-spacing:2px}.brand-mark{position:relative;width:36px;height:36px;display:block;border-radius:12px;background:#16866d;transform:rotate(-8deg)}.brand-mark span{position:absolute;display:block;width:7px;height:18px;border-radius:8px;background:white;transform:rotate(38deg);top:9px}.brand-mark span:nth-child(1){left:10px}.brand-mark span:nth-child(2){left:17px;top:5px;height:23px}.brand-mark span:nth-child(3){left:24px;top:11px;height:13px}.header-label{font-size:13px;letter-spacing:2px;color:#7d9990}
.hero{min-height:calc(100vh - 176px);display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px}.hero-copy{padding:8px 0 40px;z-index:1}.eyebrow{display:inline-flex;align-items:center;gap:9px;padding:9px 15px;border:1px solid #dcebe2;border-radius:50px;background:rgba(255,255,255,.7);font-size:13px;font-weight:600;letter-spacing:2px;color:#398b74}.eyebrow-dot{width:7px;height:7px;border-radius:50%;background:#45b88b;box-shadow:0 0 0 4px #e2f5e9}h1{font-size:clamp(48px,5.4vw,76px);line-height:1.22;letter-spacing:-3px;margin:30px 0 22px;font-weight:800}h1 em{font-style:normal;color:var(--green)}.intro{max-width:460px;color:#718b81;font-size:16px;line-height:2;letter-spacing:.4px;margin:0}.download-action{margin-top:42px}.download-button{height:64px;min-width:230px;padding:0 23px;display:inline-flex;align-items:center;justify-content:center;gap:12px;border-radius:17px;background:#16866d;box-shadow:0 13px 27px rgba(22,134,109,.24);color:white;text-decoration:none;font-size:17px;font-weight:700;transition:transform .2s,box-shadow .2s}.download-button:not(.disabled):hover{transform:translateY(-3px);box-shadow:0 18px 32px rgba(22,134,109,.3)}.download-button svg{width:22px;height:22px}.download-button.disabled{background:#8caea2;box-shadow:none;cursor:default}.button-arrow{margin-left:18px;font-size:22px;font-weight:400}.download-hint{color:#9aada4;font-size:12px;margin:13px 0 0 4px}.feature-list{display:flex;gap:27px;flex-wrap:wrap;margin-top:72px;color:#53766a;font-size:13px}.feature-list span{display:flex;align-items:center;gap:8px}.feature-list i{font-style:normal;color:#9fc6ae;font-family:Georgia,serif;font-size:17px}
.hero-visual{height:650px;position:relative;display:flex;align-items:center;justify-content:center}.visual-ring{position:absolute;border-radius:50%;border:1px solid rgba(52,155,121,.13)}.ring-back{width:620px;height:620px;background:radial-gradient(circle,rgba(226,245,232,.68),rgba(226,245,232,0) 68%)}.ring-front{width:490px;height:490px;border-style:dashed}.phone{width:288px;height:584px;padding:8px;border:4px solid #253e3b;border-radius:43px;background:#253e3b;box-shadow:25px 34px 55px rgba(38,89,70,.2),inset 0 0 0 1px #91a9a0;transform:rotate(7deg);z-index:2}.phone-screen{height:100%;overflow:hidden;border-radius:31px;background:#f8fbf7;position:relative;padding:20px 18px}.phone-status{display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:33px;color:#264c42}.phone-greeting{font-size:11px;color:#789389;display:flex;justify-content:space-between}.phone-greeting span{font-size:23px;color:#dfb85b}.phone h2{font-size:23px;line-height:1.45;margin:8px 0 0;color:#214d41}.phone-illustration{height:172px;margin:19px -18px 0;position:relative;overflow:hidden;background:linear-gradient(#e9f6ed,#d9eee4)}.sun{width:72px;height:72px;border-radius:50%;position:absolute;top:25px;left:108px;background:#f8df91;box-shadow:0 0 0 15px rgba(248,223,145,.25)}.hill{position:absolute;width:340px;height:190px;border-radius:50%}.hill-one{top:90px;left:-90px;background:#9bd0a9;transform:rotate(-15deg)}.hill-two{top:115px;left:80px;background:#56ac87;transform:rotate(-22deg)}.leaf{position:absolute;z-index:2;width:19px;height:47px;border-radius:100% 0;background:#2c8d69;bottom:1px}.leaf-one{left:65px;transform:rotate(-34deg)}.leaf-two{left:85px;transform:rotate(15deg)}.phone-content{padding-top:17px}.content-heading{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:12px}.content-heading span{color:#7baa8a}.content-row{display:flex;align-items:center;gap:10px;background:white;border-radius:13px;padding:9px;margin-bottom:8px;box-shadow:0 4px 12px rgba(29,93,64,.05);font-size:10px;font-weight:700}.content-row small,.float-card small{display:block;font-size:8px;color:#92a99b;margin-top:4px;font-weight:400}.content-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#fff1dc;color:#dea653;font-size:18px}.content-icon.green{background:#e5f4e6;color:#64aa75}.phone-nav{position:absolute;bottom:0;left:0;right:0;height:54px;background:white;display:flex;justify-content:space-around;align-items:center}.phone-nav span{display:flex;flex-direction:column;align-items:center;color:#aabbb2;font-size:20px;line-height:1}.phone-nav .active{color:#1c9571}.phone-nav small{font-size:8px;margin-top:4px}.float-card{position:absolute;z-index:3;display:flex;align-items:center;gap:11px;padding:15px 18px;background:rgba(255,255,255,.93);border:1px solid white;border-radius:17px;box-shadow:0 20px 35px rgba(41,95,67,.12);font-size:12px;font-weight:700}.float-top{top:94px;left:22px;transform:rotate(-8deg)}.float-bottom{bottom:85px;right:0;transform:rotate(5deg)}.float-icon,.check-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#fff1d8;color:#e4ab4a;font-size:19px}.check-icon{background:#e1f4e8;color:#2d9f73}.page-footer{height:70px;border-top:1px solid #e1ede5;color:#9bad9f;font-size:12px;letter-spacing:1px}
@media(max-width:900px){.download-page{padding:0 32px}.hero{grid-template-columns:1fr 1fr;gap:0}.hero-visual{transform:scale(.76);transform-origin:center}.float-top{left:-35px}.float-bottom{right:-50px}h1{font-size:52px}.feature-list{margin-top:42px}}
@media(max-width:680px){.download-page{padding:0 24px}.page-header{height:76px}.brand{font-size:20px}.header-label{display:none}.hero{display:flex;flex-direction:column;min-height:0;gap:0}.hero-copy{width:100%;padding:34px 0 0;text-align:center}.eyebrow{font-size:11px}h1{font-size:clamp(42px,11vw,60px);letter-spacing:-2px;margin:23px 0 17px}.intro{font-size:14px;line-height:1.85;max-width:420px;margin:auto}.download-action{margin-top:27px}.download-button{width:min(100%,320px);height:58px}.feature-list{justify-content:center;gap:14px;margin-top:34px;font-size:11px}.hero-visual{height:540px;width:100%;transform:scale(.78);transform-origin:top center;margin:37px 0 -80px}.float-top{left:calc(50% - 225px)}.float-bottom{right:calc(50% - 220px)}.page-footer{height:64px;font-size:10px}}
@media(max-width:380px){.download-page{padding:0 18px}.hero-visual{transform:scale(.68);margin-bottom:-140px}.feature-list{gap:10px}.float-top{left:calc(50% - 225px)}.float-bottom{right:calc(50% - 220px)}}
/* Pro 风格金属机身与品牌启动页 */
.brand-logo{display:block;width:38px;height:38px;object-fit:contain}
.phone{position:relative;width:292px;height:602px;padding:5px;border:3px solid #a5aaa9;border-radius:49px;background:#090a0b;box-shadow:inset 0 0 0 1px #e0e3e2,2px 0 0 1px #626968,24px 34px 55px rgba(38,65,57,.24);transform:rotate(7deg)}
.phone-screen{height:100%;position:relative;padding:0;border:3px solid #080909;border-radius:40px;overflow:hidden;background:#282828}
.dynamic-island{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:83px;height:24px;border-radius:20px;background:#070707;z-index:2;box-shadow:0 0 0 1px #242424}
.dynamic-island span{position:absolute;right:9px;top:8px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#263a4f,#0c1018 65%);box-shadow:0 0 0 2px #101010}
.splash-logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:76%;height:auto;object-fit:contain}
.home-indicator{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:95px;height:4px;border-radius:5px;background:#ededed}
.phone-button{position:absolute;width:4px;border-radius:3px;background:linear-gradient(90deg,#777e7d,#d1d5d4,#858c8b);left:-6px}
.button-action{top:95px;height:21px}.button-volume-up{top:139px;height:38px}.button-volume-down{top:189px;height:38px}.button-power{left:auto;right:-6px;top:157px;height:61px}
</style>

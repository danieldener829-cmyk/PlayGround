package com.tvbrasil.stream

import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webview: WebView

    private val URL_GLOBO = "https://globoplay.globo.com/tv-globo/ao-vivo/6120663/"
    private val URL_RECORD = "https://www.recordplus.com/"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webview = findViewById(R.id.webview)
        val btnGlobo = findViewById<Button>(R.id.btnGlobo)
        val btnRecord = findViewById<Button>(R.id.btnRecord)

        val s: WebSettings = webview.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.loadWithOverviewMode = true
        s.useWideViewPort = true

        // Fullscreen dentro do próprio app
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Fica DENTRO do app, não abre Chrome/outro app + Opção 2: esconde site, deixa só vídeo
        webview.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Esconde cabeçalho/rodapé/menus do Globoplay e RecordPlus, foca no player
                view?.evaluateJavascript(
                    """(function(){
                      try{
                        var css = document.createElement('style');
                        css.innerHTML = "header, nav, footer, [data-testid='header'], .glb-header, .header__container {display:none !important;} body{margin:0 !important;background:#000 !important;} main{padding:0 !important;} video{max-height:100vh !important;}";
                        document.head.appendChild(css);
                        // tenta rolar até o vídeo
                        var v = document.querySelector('video');
                        if(v){ v.scrollIntoView({block:'center'}); try{v.muted=false;}catch(e){} }
                      }catch(e){}
                    })();""".trimIndent(), null
                )
            }
        }

        // Suporte a fullscreen de vídeo dentro do app
        var customView: View? = null
        webview.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                customView?.let { return }
                customView = view
                (window.decorView as FrameLayout).addView(view, FrameLayout.LayoutParams(-1, -1))
                window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            }
            override fun onHideCustomView() {
                (window.decorView as FrameLayout).removeView(customView)
                customView = null
                window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
            }
        }

        btnGlobo.setOnClickListener { webview.loadUrl(URL_GLOBO) }
        btnRecord.setOnClickListener { webview.loadUrl(URL_RECORD) }

        // Abre Globo direto dentro do app
        if (savedInstanceState == null) webview.loadUrl(URL_GLOBO)
    }

    // Botão voltar volta a página, não fecha o app
    override fun onBackPressed() {
        if (::webview.isInitialized && webview.canGoBack()) webview.goBack()
        else super.onBackPressed()
    }
}

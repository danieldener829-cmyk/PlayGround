package com.tvbrasil.stream

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
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

        // Fica DENTRO do app, não abre Chrome/outro app
        webview.webViewClient = WebViewClient()

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

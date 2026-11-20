import { ProjectMeta } from "../types/studio";

export function createDefaultAndroidWorkflow(): string {
  return `name: Build Android App (Droid AI Studio)

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Build Debug APK
        run: ./gradlew assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-app-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
`;
}

export function createInitialProjectFiles(meta: ProjectMeta): Record<string, string> {
  const pkgPath = meta.packageName.replace(/\./g, "/");

  return {
    ".github/workflows/android.yml": createDefaultAndroidWorkflow(),
    "settings.gradle.kts": `rootProject.name = "${meta.projectName}"\ninclude(":app")\n`,
    "app/build.gradle.kts": `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${meta.packageName}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${meta.packageName}"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
}
`,
    "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${meta.projectName}"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
    [`app/src/main/java/${pkgPath}/MainActivity.kt`]: `package ${meta.packageName}

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val titleText = findViewById<TextView>(R.id.tvTitle)
        val actionBtn = findViewById<Button>(R.id.btnAction)

        titleText.text = "${meta.projectName}"
        actionBtn.setOnClickListener {
            Toast.makeText(this, "${meta.projectName} Ready!", Toast.LENGTH_SHORT).show()
        }
    }
}
`,
    "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="24dp">

    <ImageView
        android:id="@+id/ivAppLogo"
        android:layout_width="96dp"
        android:layout_height="96dp"
        android:contentDescription="App Logo"
        android:src="@mipmap/ic_launcher" />

    <TextView
        android:id="@+id/tvTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="${meta.projectName}"
        android:textSize="22sp"
        android:textStyle="bold" />

    <Button
        android:id="@+id/btnAction"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="20dp"
        android:text="Start App" />
</LinearLayout>
`,
    "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${meta.projectName}</string>
</resources>
`,
    "app/src/main/res/mipmap-xxxhdpi/logo_base64.txt": meta.logoBase64 || "",
  };
}

import { ProjectFile, StudioProject } from "../types/studio";

export interface CreateProjectInput {
  name: string;
  packageName: string;
  description?: string;
  logoDataUrl?: string;
  logoFileName?: string;
}

export function createAndroidProjectTemplate(input: CreateProjectInput): StudioProject {
  const safeName = input.name.trim() || "MyDroidApp";
  const pkg = input.packageName.trim() || "com.example.mydroidapp";
  const pkgPath = pkg.replace(/\./g, "/");

  const files: ProjectFile[] = [
    {
      path: `app/src/main/java/${pkgPath}/MainActivity.kt`,
      language: "kotlin",
      content: `package ${pkg}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    GreetingScreen("${safeName}")
                }
            }
        }
    }
}

@Composable
fun GreetingScreen(appName: String) {
    Column(modifier = Modifier.padding(24.dp)) {
        Text(text = appName, style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "Built with Droid AI Studio")
    }
}
`,
    },
    {
      path: "app/src/main/res/values/strings.xml",
      language: "xml",
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${safeName}</string>
</resources>
`,
    },
    {
      path: "app/src/main/AndroidManifest.xml",
      language: "xml",
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
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
    },
    {
      path: "app/build.gradle.kts",
      language: "kotlin",
      content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${pkg}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
}
`,
    },
  ];

  if (input.logoDataUrl) {
    files.push({
      path: "app/src/main/res/drawable/app_logo_base64.txt",
      language: "text",
      content: `Logo File: ${input.logoFileName || "logo.png"}\nData URL:\n${input.logoDataUrl}`,
    });
  }

  return {
    name: safeName,
    packageName: pkg,
    description: input.description || `${safeName} Android Project`,
    logoDataUrl: input.logoDataUrl,
    logoFileName: input.logoFileName,
    files,
  };
}

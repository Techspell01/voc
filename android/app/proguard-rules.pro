# Keep the app's own components: the launcher activity is named in the manifest and
# the keyboard is started by the system, so R8 must not rename or drop them.
-keep class com.techspell.voc.MainActivity { *; }
-keep class com.techspell.voc.ime.** { *; }

-dontwarn org.apache.commons.**

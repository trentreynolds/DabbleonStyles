# Font licensing

Both typefaces used in this system are released under the **SIL Open Font
License, Version 1.1**. This was verified against the upstream licence files in
the Google Fonts repository, not from memory.

| Family | Copyright | Licence | Upstream |
|---|---|---|---|
| Jost | Copyright 2020 The Jost Project Authors | OFL 1.1 | `google/fonts/ofl/jost/OFL.txt` |
| Spectral | Copyright 2017 The Spectral Project Authors | OFL 1.1 | `google/fonts/ofl/spectral/OFL.txt` |

## What OFL 1.1 permits

- Commercial use, without payment, registration, or notification
- Self-hosting on any number of commercial websites, with no pageview cap
- Embedding in shipped iOS and macOS applications
- Embedding in PDFs, video, and print
- Modification, including subsetting and re-instancing variable fonts
- Redistribution, bundled or standalone

## What OFL 1.1 requires

1. Keep the `OFL.txt` file with the fonts wherever they are redistributed.
   `scripts/fetch-fonts.sh` downloads it alongside each family for this reason.
2. Do not sell the font files by themselves. Selling a product that *contains*
   them is fine; selling the fonts as the product is not.
3. If you modify a font and redistribute it, do not use the Reserved Font Name
   ("Jost", "Spectral") on the modified version. Renaming is only required if you
   redistribute the modified file, not if you use it privately.

## What it does not require

No attribution in your UI or credits. No "powered by" notice. No copyleft
obligation on your own code — OFL applies to the font files, and does not reach
the software that uses them.

## Not legal advice

This is an accurate summary of the licence terms, not a lawyer's opinion. For an
ordinary commercial website or app it is about as low-risk as font licensing
gets, but if you are in an unusual situation — reselling a design asset pack,
bundling fonts into a product other people redistribute — read the full OFL text
in the fetched `*-OFL.txt` files or ask counsel.

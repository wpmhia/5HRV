# 5HRV

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A scientific HRV calculator that analyses five-minute heart rate variability recordings using peer-reviewed physiological research and published age- and sex-specific reference populations.

https://5hrv.com

## Scientific foundation

5HRV interprets five-minute HRV measurements using the DanFunD reference population (Brinth et al., *Scand J Public Health*, 2024). Metrics include RMSSD (cardiac vagal modulation), SDNN (total short-term variability), and LF/HF (spectral distribution). All calculations are transparent, documented in the Methodology page, and open for inspection.

## Development

```bash
bun install
bun run dev        # development server
bun run typecheck  # TypeScript check
bun test           # unit tests (Vitest)
bun run test:e2e   # end-to-end tests (Playwright)
```

## Open Source

5HRV is released under the MIT License.

The source code, algorithms and implementation are freely available for inspection, research and reuse. Third-party dependencies are MIT-, BSD- or Apache-2.0-licensed; see `package.json` and the respective packages for their license texts. Reference percentiles are transcribed from the published DanFunD paper (Tables 2 and 3); please cite the original publication when reusing them.

If you use 5HRV in research, please cite the project and the underlying scientific references:

- Brinth LS et al. Normative values of short-term heart rate variability in a cross-sectional study of a Danish population: the DanFunD study. *Scand J Public Health*. 2024;52:48–57. DOI: 10.1177/14034948221124020
- Task Force of the ESC/NASPE. Heart rate variability: standards of measurement, physiological interpretation, and clinical use. *Circulation* 1996; 93(5): 1043–1065.

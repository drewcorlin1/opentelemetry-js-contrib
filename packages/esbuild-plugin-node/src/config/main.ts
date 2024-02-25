/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EsbuildInstrumentationConfigMap } from '../types';
import { InstrumentationModuleDefinition } from '@opentelemetry/instrumentation';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export const instrumentations: InstrumentationModuleDefinition<any>[] =
  getNodeAutoInstrumentations()
    .flatMap(i => i.getModuleDefinitions() ?? [])
    .filter(Boolean);

function configGenerator<T extends { enabled?: boolean }>(
  config?: T
): string | undefined {
  if (!config) return;
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(config).filter(([, v]) => typeof v !== 'function')
    )
  );
}

export function getOtelPackageToInstrumentationConfig() {
  const otelPackageToInstrumentationConfig: Record<
    string,
    {
      oTelInstrumentationPackage: keyof EsbuildInstrumentationConfigMap;
      oTelInstrumentationClass: string;
      configGenerator: <T extends { enabled?: boolean }>(
        config?: T
      ) => string | undefined;
    }
  > = {};
  for (const instrumentation of getNodeAutoInstrumentations()) {
    const instrumentationModuleDefinitions = [instrumentation.init()]
      .flat()
      .filter(Boolean);
    for (const instrumentationModuleDefinition of instrumentationModuleDefinitions) {
      otelPackageToInstrumentationConfig[instrumentationModuleDefinition.name] =
        {
          oTelInstrumentationPackage:
            instrumentation.instrumentationName as keyof EsbuildInstrumentationConfigMap,
          // TODO: Do we need to worry about minification/obfuscation messing with this class name?
          oTelInstrumentationClass: instrumentation.constructor.name,
          configGenerator,
        };
    }
  }
  return otelPackageToInstrumentationConfig;
}

export const otelPackageToInstrumentationConfig =
  getOtelPackageToInstrumentationConfig();

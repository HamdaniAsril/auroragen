import { render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { StudioErrorBoundary } from './ErrorBoundary'

function Broken(): never {
  throw new Error('shader link failed')
}

test('a renderer failure shows a message instead of a blank page', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { container } = render(
    <StudioErrorBoundary>
      <Broken />
    </StudioErrorBoundary>,
  )
  expect(container.textContent).toMatch(/WebGL2/)
})

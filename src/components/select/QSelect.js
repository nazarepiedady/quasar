import Vue from 'vue'

import QField from '../field/QField.js'
import QMenu from '../menu/QMenu.js'

import QItem from '../list/QItem.js'
import QItemSection from '../list/QItemSection.js'

import { isDeepEqual } from '../../utils/is.js'

export default Vue.extend({
  name: 'QSelect',

  mixins: [ QField ],

  props: {
    value: {
      required: true
    },

    useObject: Boolean,
    multiple: Boolean,

    options: {
      type: Array,
      default: () => []
    },

    optionLabel: {
      type: [Function, String],
      default: 'label'
    },
    optionValue: {
      type: [Function, String],
      default: 'value'
    },

    counter: Boolean,
    maxValues: [Number, String]
  },

  data () {
    return {
      optionsToShow: 20
    }
  },

  computed: {
    innerValue () {
      return this.value === void 0 || this.value === null
        ? false
        : this.value
    },

    selected () {
      const filter = this.options
        .filter(opt => this.__isActive(opt))
        .map(opt => this.__getOptionLabel(opt))

      return this.multiple === true
        ? filter.join(', ')
        : (filter[0] !== void 0 ? filter[0] : '')
    },

    computedCounter () {
      if (this.multiple === true && this.counter === true) {
        return this.value.length + (this.maxValues !== void 0 ? ' / ' + this.maxValues : '')
      }
    },

    optionScope () {
      return this.options.slice(0, this.optionsToShow).map((opt, i) => ({
        index: i,
        opt,
        active: this.__isActive(opt),
        click: () => { this.toggleOption(opt) }
      }))
    }
  },

  methods: {
    toggleOption (opt) {
      const val = this.__getOptionValue(opt)

      if (this.multiple) {
        const
          model = [].concat(this.value),
          index = model.findIndex(v => isDeepEqual(v, val))

        if (index > -1) {
          this.$emit('input', model)
          this.$emit('remove', { index, value: model.splice(index, 1) })
        }
        else {
          if (this.maxValues !== void 0 && model.length < this.maxValues) {
            return
          }

          this.$emit('input', model)
          model.push(val)
          this.$emit('add', { index: model.length - 1, value: opt })
        }
      }
      else {
        !isDeepEqual(this.value, val) && this.$emit('input', val)
      }
    },

    __getOptionValue (opt) {
      if (this.useObject === true) {
        return opt
      }

      const prop = this.optionValue
      return typeof prop === 'function'
        ? prop(opt)
        : opt[prop]
    },

    __getOptionLabel (opt) {
      const prop = this.optionLabel
      return typeof prop === 'function'
        ? prop(opt)
        : opt[prop]
    },

    __isActive (opt) {
      const optVal = this.__getOptionValue(opt)
      return this.multiple === true
        ? this.value.find(val => isDeepEqual(val, optVal)) !== void 0
        : isDeepEqual(this.value, optVal)
    },

    __onFocus (e) {
      this.focused = true
      this.optionsToShow = 20
      this.$emit('focus', e)
    },

    __onBlur (e) {
      this.focused = false
      this.$emit('blur', e)
    },

    __onScroll () {
      if (this.optionsToShow < this.options.length) {
        const el = this.$refs.menu.__portal.$el

        if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
          this.optionsToShow += 20
        }
      }
    },

    __getControl (h) {
      return h('div', {
        staticClass: 'q-field__native row items-center no-wrap',
        attrs: { tabindex: this.editable === true ? 0 : null },
        on: this.editable === true ? {
          focus: this.__onFocus,
          blur: this.__onBlur
        } : null,
        domProps: this.$slots.selected === void 0 ? {
          innerHTML: this.selected
        } : null
      }, this.$slots.selected)
    },

    __getOptions (h) {
      const fn = this.$scopedSlots.option || (scope => h(QItem, {
        key: scope.index,
        props: {
          clickable: true,
          active: scope.active
        },
        on: {
          click: scope.click
        }
      }, [
        h(QItemSection, {
          domProps: {
            innerHTML: this.__getOptionLabel(scope.opt)
          }
        })
      ]))

      return this.optionScope.map(fn)
    },

    __getDefaultSlot (h) {
      if (this.editable === false) { return }

      return h(QMenu, {
        ref: 'menu',
        props: {
          cover: true,
          autoClose: this.multiple !== true
        },
        on: {
          'before-show': this.__onFocus,
          'before-hide': this.__onBlur,
          '&scroll': this.__onScroll
        }
      }, this.__getOptions(h))
    }
  },

  created () {
    this.fieldClass = 'q-select'
  }
})
